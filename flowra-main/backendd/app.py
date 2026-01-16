from flask import Flask,request,jsonify,render_template,send_from_directory
import sqlite3
import requests
import datetime
import os
from dotenv import load_dotenv
from database import get_db
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit

# Load environment variables
load_dotenv()


app = Flask(__name__,
            static_folder='templates/build/static',
            template_folder='templates/build')
CORS(app)

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

# Configure Flask from environment
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
app.config['ENV'] = os.getenv('FLASK_ENV', 'production')

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/api/register_sensor",methods=['POST'])
def register_sensor():
    data=request.json

    conn=get_db()
    conn.execute(
        "INSERT INTO sensors (sensor_id,latitude,longitude,area) VALUES(?,?,?,?)",
        (
            data["sensor_id"],
            data["latitude"],
            data["longitude"],
            data["area"]
        )
    )

    conn.commit()
    conn.close()

    return jsonify({"message":"Sensor registered successfully"})


THRESHOLD = int(os.getenv('WATER_LEVEL_THRESHOLD', '70'))

# Blynk API Configuration
BLYNK_AUTH_TOKEN = os.getenv('BLYNK_AUTH_TOKEN')
BLYNK_BASE_URL = os.getenv('BLYNK_BASE_URL', 'https://blynk.cloud/external/api/get')
BLYNK_PINS = os.getenv('BLYNK_PINS', 'V0,V1').split(',')  # Pins to monitor
BLYNK_HEARTBEAT_PIN = os.getenv('BLYNK_HEARTBEAT_PIN', 'V9')  # Heartbeat/timestamp pin
BLYNK_HEARTBEAT_TIMEOUT = int(os.getenv('BLYNK_HEARTBEAT_TIMEOUT', '15'))  # Seconds before device considered offline
FETCH_INTERVAL_MINUTES = int(os.getenv('FETCH_INTERVAL_MINUTES', '5'))  # Fetch every 5 minutes

def is_device_online():
    """
    Check if the device is online by fetching the heartbeat pin.
    Returns (is_online: bool, heartbeat_value: float, age_seconds: float)
    """
    if not BLYNK_AUTH_TOKEN:
        return False, None, None

    try:
        url = f"{BLYNK_BASE_URL}?token={BLYNK_AUTH_TOKEN}&{BLYNK_HEARTBEAT_PIN}"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            # Heartbeat should be a Unix timestamp (seconds since epoch)
            heartbeat_value = float(response.text.strip())
            current_time = datetime.datetime.now().timestamp()
            age_seconds = current_time - heartbeat_value

            is_online = age_seconds <= BLYNK_HEARTBEAT_TIMEOUT

            return is_online, heartbeat_value, age_seconds
        else:
            print(f"[WARNING] Failed to fetch heartbeat pin {BLYNK_HEARTBEAT_PIN}: HTTP {response.status_code}")
            return False, None, None

    except Exception as e:
        print(f"[ERROR] Error checking device status: {str(e)}")
        return False, None, None

def fetch_blynk_data_background():
    """
    Background task that fetches data from Blynk API and stores it in database
    Runs periodically based on FETCH_INTERVAL_MINUTES

    Checks device heartbeat first - only stores data if device is online
    Values are decoded (divided by 100) to restore full precision
    """
    if not BLYNK_AUTH_TOKEN:
        print("[WARNING] Blynk Auth Token not configured. Skipping background fetch.")
        return

    print(f"[INFO] Fetching Blynk data at {datetime.datetime.now()}")

    # Check if device is online via heartbeat
    is_online, heartbeat_value, age_seconds = is_device_online()

    if not is_online:
        if age_seconds is not None:
            print(f"[OFFLINE] Device OFFLINE — Heartbeat is {age_seconds:.1f}s old (threshold: {BLYNK_HEARTBEAT_TIMEOUT}s). Ignoring cached Blynk values.")
        else:
            print(f"[OFFLINE] Device OFFLINE — Could not read heartbeat pin {BLYNK_HEARTBEAT_PIN}. Ignoring cached Blynk values.")
        return

    # Device is online - proceed with fetching sensor data
    print(f"[ONLINE] Device ONLINE — Heartbeat is {age_seconds:.1f}s fresh. Fetching sensor data...")

    for pin in BLYNK_PINS:
        pin = pin.strip()
        try:
            # Fetch from Blynk API
            url = f"{BLYNK_BASE_URL}?token={BLYNK_AUTH_TOKEN}&{pin}"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                # Blynk returns encoded value (multiplied by 100)
                encoded_value = float(response.text.strip())

                # Decode: divide by 100 to get real sensor value with precision
                decoded_value = encoded_value / 100.0

                sensor_id = f"blynk_{pin}"
                timestamp = datetime.datetime.now()

                print(f"[DECODE] Received encoded value: {encoded_value} → Decoded: {decoded_value} cm")

                # Store decoded value in database
                conn = get_db()
                conn.execute(
                    "INSERT INTO readings(sensor_id, water_level, timestamp) VALUES (?, ?, ?)",
                    (sensor_id, decoded_value, timestamp)
                )

                # Check for alerts using decoded value
                if decoded_value > THRESHOLD:
                    conn.execute(
                        "INSERT INTO alerts(sensor_id, water_level, timestamp) VALUES (?, ?, ?)",
                        (sensor_id, decoded_value, timestamp)
                    )

                conn.commit()
                conn.close()

                print(f"[LIVE] Stored reading: {sensor_id} = {decoded_value} cm at {timestamp}")
            else:
                print(f"[ERROR] Failed to fetch {pin}: HTTP {response.status_code}")

        except Exception as e:
            print(f"[ERROR] Error fetching data for {pin}: {str(e)}")

# Schedule the background task - DISABLED per user request
# scheduler.add_job(
#     func=fetch_blynk_data_background,
#     trigger=IntervalTrigger(minutes=FETCH_INTERVAL_MINUTES),
#     id='blynk_data_fetch',
#     name='Fetch Blynk sensor data',
#     replace_existing=True
# )

# Run once immediately on startup - DISABLED per user request
# fetch_blynk_data_background()

@app.route("/api/scheduler/status", methods=["GET"])
def get_scheduler_status():
    """Get the status of the background scheduler"""
    try:
        job = scheduler.get_job('blynk_data_fetch')

        if job:
            next_run = job.next_run_time.isoformat() if job.next_run_time else None

            # Get last reading timestamp
            conn = get_db()
            last_reading = conn.execute(
                "SELECT MAX(timestamp) as last_time FROM readings"
            ).fetchone()
            conn.close()

            return jsonify({
                "success": True,
                "scheduler": {
                    "running": True,
                    "job_name": job.name,
                    "next_run": next_run,
                    "interval_minutes": FETCH_INTERVAL_MINUTES,
                    "pins_monitored": BLYNK_PINS,
                    "last_reading_time": last_reading["last_time"] if last_reading else None
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": "Scheduler job not found"
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get scheduler status: {str(e)}"
        }), 500

@app.route("/api/sensor_data",methods=["POST"])
def sensor_data():
    data=request.json
    sensor_id=data["sensor_id"]
    water_level=data["water_level"]

    conn=get_db()

    conn.execute(
        "INSERT INTO readings(sensor_id,water_level) VALUES (?,?)",
        (sensor_id,water_level)
    )

    if water_level>THRESHOLD:
        conn.execute(
            "INSERT INTO alerts (sensor_id,water_level) VALUES (?,?)",
            (sensor_id,water_level)
        )

    conn.commit()
    conn.close()

    return jsonify({"status":"data received"})

@app.route("/api/fetch-blynk", methods=["GET"])
def fetch_blynk():
    try:
        # Get parameters from request or environment
        token = request.args.get('token') or os.getenv('BLYNK_AUTH_TOKEN')
        pin = request.args.get('pin', 'V0')  # Default to V0 if not specified
        sensor_id = request.args.get('sensor_id', f'blynk_{pin}')  # Default sensor ID based on pin
        base_url = os.getenv('BLYNK_BASE_URL', 'https://blynk.cloud/external/api/get')

        if not token:
            return jsonify({"error": "Blynk auth token is required. Please set BLYNK_AUTH_TOKEN in .env file or provide as query parameter"}), 400

        # Blynk API URL
        blynk_url = f"{base_url}?token={token}&{pin}"

        # Make request to Blynk API
        response = requests.get(blynk_url, timeout=10)

        if response.status_code == 200:
            # Blynk returns the value directly as text
            sensor_value = response.text.strip()

            # Try to convert to float if it's a number
            try:
                sensor_value = float(sensor_value)
            except ValueError:
                pass  # Keep as string if not a number

            # Store the reading in database
            try:
                conn = get_db()
                conn.execute(
                    "INSERT INTO readings(sensor_id, water_level) VALUES (?, ?)",
                    (sensor_id, sensor_value)
                )

                # Check if water level exceeds threshold and create alert
                if isinstance(sensor_value, (int, float)) and sensor_value > THRESHOLD:
                    conn.execute(
                        "INSERT INTO alerts(sensor_id, water_level) VALUES (?, ?)",
                        (sensor_id, sensor_value)
                    )

                conn.commit()
                conn.close()
            except Exception as db_error:
                print(f"Database error: {db_error}")
                # Continue with API response even if database fails

            return jsonify({
                "success": True,
                "sensor_value": sensor_value,
                "pin": pin,
                "sensor_id": sensor_id,
                "timestamp": datetime.datetime.now().isoformat(),
                "stored_in_db": True
            })
        else:
            return jsonify({
                "error": f"Blynk API returned status code {response.status_code}",
                "details": response.text
            }), response.status_code

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to Blynk API timed out"}), 408
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to connect to Blynk API: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route("/api/store-reading", methods=["POST"])
def store_reading():
    """Automatically fetch from Blynk and store in database"""
    try:
        # Get parameters from request or use defaults
        token = request.json.get('token') if request.json else None
        token = token or os.getenv('BLYNK_AUTH_TOKEN')
        pin = request.json.get('pin', 'V0') if request.json else 'V0'
        sensor_id = request.json.get('sensor_id', f'blynk_{pin}') if request.json else f'blynk_{pin}'
        base_url = os.getenv('BLYNK_BASE_URL', 'https://blynk.cloud/external/api/get')

        if not token:
            return jsonify({
                "success": False,
                "error": "Blynk auth token is required. Please set BLYNK_AUTH_TOKEN in .env file"
            }), 400

        # STEP 1: Fetch data from Blynk API
        blynk_url = f"{base_url}?token={token}&{pin}"
        response = requests.get(blynk_url, timeout=10)

        if response.status_code != 200:
            return jsonify({
                "success": False,
                "error": f"Blynk API returned status code {response.status_code}",
                "details": response.text
            }), response.status_code

        # Parse sensor value
        sensor_value = response.text.strip()
        try:
            sensor_value = float(sensor_value)
        except ValueError:
            pass  # Keep as string if not a number

        # STEP 2: Store in database
        conn = get_db()

        # Store reading
        conn.execute(
            "INSERT INTO readings(sensor_id, water_level) VALUES (?, ?)",
            (sensor_id, sensor_value)
        )

        # STEP 3: Check for alerts and store if needed
        alert_created = False
        if isinstance(sensor_value, (int, float)) and sensor_value > THRESHOLD:
            conn.execute(
                "INSERT INTO alerts(sensor_id, water_level) VALUES (?, ?)",
                (sensor_id, sensor_value)
            )
            alert_created = True

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Reading stored successfully",
            "data": {
                "sensor_id": sensor_id,
                "sensor_value": sensor_value,
                "pin": pin,
                "alert_created": alert_created,
                "timestamp": datetime.datetime.now().isoformat()
            }
        })

    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "error": "Request to Blynk API timed out"
        }), 408
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to store reading: {str(e)}"
        }), 500

@app.route("/api/webhook/blynk", methods=["POST"])
def blynk_webhook():
    """
    Blynk Webhook Endpoint
    Receives sensor data from Blynk when a datastream updates

    Expected payload from Blynk:
    {
        "pin": "V0",
        "value": 75.5,
        "device_id": "device123"
    }
    """
    try:
        # Get data from Blynk webhook
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No data received"
            }), 400

        # Extract sensor data from webhook payload
        pin = data.get('pin', 'V0')
        sensor_value = data.get('value', 0)
        device_id = data.get('device_id', 'blynk_webhook')
        sensor_id = f"{device_id}_{pin}"

        # Store in database
        conn = get_db()
        conn.execute(
            "INSERT INTO readings(sensor_id, water_level) VALUES (?, ?)",
            (sensor_id, sensor_value)
        )

        # Check for alerts
        alert_created = False
        if isinstance(sensor_value, (int, float)) and sensor_value > THRESHOLD:
            conn.execute(
                "INSERT INTO alerts(sensor_id, water_level) VALUES (?, ?)",
                (sensor_id, sensor_value)
            )
            alert_created = True

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Webhook data received and stored",
            "data": {
                "sensor_id": sensor_id,
                "water_level": sensor_value,
                "pin": pin,
                "alert_created": alert_created,
                "timestamp": datetime.datetime.now().isoformat()
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Webhook processing failed: {str(e)}"
        }), 500

@app.route("/api/latest", methods=["GET"])
def get_latest_reading():
    """
    Get the most recent water level reading from database
    Returns the latest sensor reading with timestamp
    """
    try:
        conn = get_db()
        latest = conn.execute(
            "SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()
        conn.close()

        if not latest:
            return jsonify({
                "success": True,
                "data": None,
                "message": "No readings available"
            })

        return jsonify({
            "success": True,
            "data": {
                "id": latest["id"],
                "sensor_id": latest["sensor_id"],
                "water_level": latest["water_level"],
                "timestamp": latest["timestamp"]
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch latest reading: {str(e)}"
        }), 500

@app.route("/api/drainage-locations", methods=["GET"])
def get_drainage_locations():
    """
    Get all drainage locations with their latest water level readings
    Returns sensor coordinates and latest water level for map display
    """
    try:
        conn = get_db()

        # Get all sensors with their coordinates
        sensors = conn.execute(
            "SELECT sensor_id, latitude, longitude, area FROM sensors ORDER BY sensor_id"
        ).fetchall()

        drainage_locations = []
        for sensor in sensors:
            # Get latest reading for this sensor
            latest_reading = conn.execute(
                "SELECT water_level, timestamp FROM readings WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT 1",
                (sensor["sensor_id"],)
            ).fetchone()

            # Build location object
            location = {
                "sensor_id": sensor["sensor_id"],
                "latitude": sensor["latitude"],
                "longitude": sensor["longitude"],
                "area": sensor["area"],
                "water_level": latest_reading["water_level"] if latest_reading else 0,
                "timestamp": latest_reading["timestamp"] if latest_reading else None,
                "name": f"{sensor['area']} Drain" if sensor["area"] else f"Sensor {sensor['sensor_id']}"
            }
            drainage_locations.append(location)

        conn.close()

        return jsonify({
            "success": True,
            "locations": drainage_locations,
            "count": len(drainage_locations)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch drainage locations: {str(e)}"
        }), 500

@app.route("/api/sensors", methods=["GET"])
def get_sensors():
    """Get all sensors from database"""
    try:
        conn = get_db()
        sensors = conn.execute("SELECT * FROM sensors ORDER BY sensor_id").fetchall()
        conn.close()

        sensor_list = []
        for sensor in sensors:
            sensor_list.append({
                "sensor_id": sensor["sensor_id"],
                "latitude": sensor["latitude"],
                "longitude": sensor["longitude"],
                "area": sensor["area"]
            })

        return jsonify({"sensors": sensor_list})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch sensors: {str(e)}"}), 500

@app.route("/api/sensors/add-location", methods=["POST"])
def add_sensor_location():
    """
    Register or update sensor location
    Accepts: sensor_id, sensor_name, latitude, longitude, area
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400

        # Extract data
        sensor_id = data.get('sensor_id', '').strip()
        sensor_name = data.get('sensor_name', '').strip()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        area = data.get('area', 'Unknown Area').strip()

        # Validation
        if not sensor_id:
            return jsonify({
                "success": False,
                "error": "Sensor ID is required"
            }), 400

        if not sensor_name:
            return jsonify({
                "success": False,
                "error": "Sensor Name is required"
            }), 400

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "error": "Invalid latitude or longitude format"
            }), 400

        if latitude < -90 or latitude > 90:
            return jsonify({
                "success": False,
                "error": "Latitude must be between -90 and 90"
            }), 400

        if longitude < -180 or longitude > 180:
            return jsonify({
                "success": False,
                "error": "Longitude must be between -180 and 180"
            }), 400

        # Database operation
        conn = get_db()

        # Check if sensor already exists
        existing = conn.execute(
            "SELECT sensor_id FROM sensors WHERE sensor_id = ?",
            (sensor_id,)
        ).fetchone()

        if existing:
            # Update existing sensor
            conn.execute(
                "UPDATE sensors SET latitude = ?, longitude = ?, area = ? WHERE sensor_id = ?",
                (latitude, longitude, area, sensor_id)
            )
            action = "updated"
        else:
            # Insert new sensor
            conn.execute(
                "INSERT INTO sensors (sensor_id, latitude, longitude, area) VALUES (?, ?, ?, ?)",
                (sensor_id, latitude, longitude, area)
            )
            action = "registered"

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Sensor {action} successfully",
            "data": {
                "sensor_id": sensor_id,
                "sensor_name": sensor_name,
                "latitude": latitude,
                "longitude": longitude,
                "area": area
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to register sensor: {str(e)}"
        }), 500

@app.route("/api/readings", methods=["GET"])
def get_readings():
    """Get sensor readings from database"""
    try:
        limit = int(request.args.get('limit', '100'))
        sensor_id = request.args.get('sensor_id')

        conn = get_db()
        if sensor_id:
            readings = conn.execute(
                "SELECT * FROM readings WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT ?",
                (sensor_id, limit)
            ).fetchall()
        else:
            readings = conn.execute(
                "SELECT * FROM readings ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            ).fetchall()
        conn.close()

        reading_list = []
        for reading in readings:
            reading_list.append({
                "id": reading["id"],
                "sensor_id": reading["sensor_id"],
                "water_level": reading["water_level"],
                "timestamp": reading["timestamp"]
            })

        return jsonify({"readings": reading_list})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch readings: {str(e)}"}), 500

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get alerts from database"""
    try:
        limit = int(request.args.get('limit', '50'))

        conn = get_db()
        alerts = conn.execute(
            "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()
        conn.close()

        alert_list = []
        for alert in alerts:
            alert_list.append({
                "id": alert["id"],
                "sensor_id": alert["sensor_id"],
                "water_level": alert["water_level"],
                "timestamp": alert["timestamp"]
            })

        return jsonify({"alerts": alert_list})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch alerts: {str(e)}"}), 500

@app.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db()

        # Get total sensors
        total_sensors = conn.execute("SELECT COUNT(*) as count FROM sensors").fetchone()["count"]

        # Get total readings
        total_readings = conn.execute("SELECT COUNT(*) as count FROM readings").fetchone()["count"]

        # Get total alerts
        total_alerts = conn.execute("SELECT COUNT(*) as count FROM alerts").fetchone()["count"]

        # Get latest reading
        latest_reading = conn.execute(
            "SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()

        # Get recent readings (last 24 hours)
        recent_readings = conn.execute(
            "SELECT * FROM readings WHERE timestamp >= datetime('now', '-1 day') ORDER BY timestamp DESC"
        ).fetchall()

        # Get average water level from recent readings
        if recent_readings:
            avg_water_level = sum(reading["water_level"] for reading in recent_readings) / len(recent_readings)
        else:
            avg_water_level = 0

        conn.close()

        stats = {
            "total_sensors": total_sensors,
            "total_readings": total_readings,
            "total_alerts": total_alerts,
            "avg_water_level": round(avg_water_level, 2),
            "latest_reading": {
                "sensor_id": latest_reading["sensor_id"] if latest_reading else None,
                "water_level": latest_reading["water_level"] if latest_reading else None,
                "timestamp": latest_reading["timestamp"] if latest_reading else None
            } if latest_reading else None,
            "recent_readings_count": len(recent_readings)
        }

        return jsonify({"stats": stats})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch dashboard stats: {str(e)}"}), 500

if __name__ == "__main__":
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '5030'))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host=host, port=port, debug=debug)


def create_tables():
    conn=sqlite3.connect("water_alert.db")
    cur=conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sensors(
                sensor_id TEXT PRIMARY KEY,
                latitude REAL,
                longitude REAL,
                area TEXT
                )
                """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS readings(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor_id TEXT,
                water_level REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )

                """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor_id TEXT,
                water_level REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """)


    conn.commit()
    conn.close()

@app.route("/api/webhook/blynk", methods=["POST"])
def blynk_webhook():
    """
    Webhook endpoint for Blynk datastream updates
    Decodes incoming values (divides by 100) to restore full precision
    """
    try:
        # Blynk webhook data structure
        webhook_data = request.json

        if not webhook_data:
            return jsonify({"error": "No webhook data received"}), 400

        # Extract data from Blynk webhook
        # Blynk typically sends data in this format:
        # {
        #   "deviceName": "Device Name",
        #   "deviceId": "device_id",
        #   "datastreamId": "V0",  # or "V1", etc.
        #   "value": "sensor_value",
        #   "timestamp": unix_timestamp
        # }

        device_name = webhook_data.get('deviceName', 'Unknown Device')
        device_id = webhook_data.get('deviceId', f'blynk_webhook_{webhook_data.get("datastreamId", "unknown")}')
        datastream_id = webhook_data.get('datastreamId', 'V0')
        encoded_value = webhook_data.get('value')
        timestamp = webhook_data.get('timestamp')

        if encoded_value is None:
            return jsonify({"error": "No sensor value in webhook data"}), 400

        # Convert encoded value to float
        try:
            encoded_value = float(encoded_value)
            # Decode: divide by 100 to get real sensor value with precision
            decoded_value = encoded_value / 100.0

            print(f"[WEBHOOK] Received encoded value: {encoded_value} → Decoded: {decoded_value} cm")
        except (ValueError, TypeError):
            return jsonify({"error": f"Invalid sensor value: {encoded_value}"}), 400

        # Store decoded value in database
        conn = get_db()

        # Store reading with decoded value
        conn.execute(
            "INSERT INTO readings(sensor_id, water_level) VALUES (?, ?)",
            (device_id, decoded_value)
        )

        # Create alert if decoded water level exceeds threshold
        if decoded_value > THRESHOLD:
            conn.execute(
                "INSERT INTO alerts(sensor_id, water_level) VALUES (?, ?)",
                (device_id, decoded_value)
            )
            print(f"[ALERT] Water level {decoded_value} cm exceeds threshold {THRESHOLD} cm")

        conn.commit()
        conn.close()

        print(f"[WEBHOOK] Stored: Device={device_name}, Value={decoded_value} cm, Datastream={datastream_id}")

        return jsonify({
            "success": True,
            "message": "Webhook data decoded and stored successfully",
            "data": {
                "device_id": device_id,
                "encoded_value": encoded_value,
                "decoded_value": decoded_value,
                "datastream_id": datastream_id,
                "timestamp": datetime.datetime.now().isoformat()
            }
        }), 200

    except Exception as e:
        print(f"[WEBHOOK ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to process webhook: {str(e)}"
        }), 500

@app.route("/api/latest", methods=["GET"])
def get_latest_reading():
    """Get the most recent water level reading from database"""
    try:
        conn = get_db()

        # Get the latest reading
        latest_reading = conn.execute(
            "SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()

        conn.close()

        if latest_reading:
            return jsonify({
                "success": True,
                "latest_reading": {
                    "id": latest_reading["id"],
                    "sensor_id": latest_reading["sensor_id"],
                    "water_level": latest_reading["water_level"],
                    "timestamp": latest_reading["timestamp"]
                }
            })
        else:
            return jsonify({
                "success": True,
                "latest_reading": None,
                "message": "No readings found in database"
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch latest reading: {str(e)}"
        }), 500

create_tables()

from flask import Flask,request,jsonify,render_template
import sqlite3
from database import get_db
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend is running i am so excited!"

@app.route("/hehehe")
def hehehe():
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


THRESHOLD=70

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

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=5030,debug=True)


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


create_tables()
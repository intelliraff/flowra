# 🔄 Automatic Blynk Data Fetching System

## ✅ What's Been Implemented

Your Flowra system now automatically fetches sensor data from Blynk API at regular intervals and stores all readings with timestamps in the database!

---

## 🎯 System Overview

### **Background Scheduler**

A background task runs continuously while Flask is running:
- ✅ **Fetches data from Blynk API** automatically
- ✅ **Stores all readings** with timestamps
- ✅ **Creates alerts** when water level exceeds threshold
- ✅ **Runs periodically** (configurable interval)
- ✅ **No manual intervention** required

---

## ⚙️ Configuration

### **Environment Variables (.env)**

```env
# Blynk API Configuration
BLYNK_AUTH_TOKEN=your_token_here
BLYNK_BASE_URL=https://blynk.cloud/external/api/get
BLYNK_PINS=V0,V1              # Comma-separated pins to monitor
FETCH_INTERVAL_MINUTES=5       # Fetch every 5 minutes

# Water Monitoring Configuration
WATER_LEVEL_THRESHOLD=70       # Alert threshold in cm
```

### **Key Settings:**

1. **BLYNK_PINS**
   - Comma-separated list of virtual pins
   - Example: `V0,V1,V2,V3`
   - Each pin is monitored separately

2. **FETCH_INTERVAL_MINUTES**
   - How often to fetch data (in minutes)
   - Recommended: 5-15 minutes
   - Lower = more frequent updates (more API calls)
   - Higher = fewer updates (fewer API calls)

---

## 🔄 How It Works

### **Automatic Fetch Process:**

```
1. Flask app starts
   ↓
2. Background scheduler initialized
   ↓
3. Fetch job scheduled (every X minutes)
   ↓
4. Immediate first fetch (on startup)
   ↓
5. Every X minutes:
   ├─ For each pin in BLYNK_PINS:
   │  ├─ Fetch value from Blynk API
   │  ├─ Store reading with timestamp
   │  ├─ Check if > threshold
   │  └─ Create alert if needed
   └─ Log results to console
```

### **Data Flow:**

```
Blynk API (V0, V1, etc.)
    ↓ (every X minutes)
Background Scheduler
    ↓
Flask fetch_blynk_data_background()
    ↓
Database (readings table)
    INSERT with timestamp
    ↓
Alerts table (if > threshold)
    ↓
Dashboard displays data
```

---

## 💾 Database Storage

### **Readings Table:**

Every fetch stores a record with:
- `sensor_id` - e.g., `blynk_V0`
- `water_level` - numeric value from Blynk
- `timestamp` - exact time of reading

**Example Query:**
```sql
SELECT * FROM readings
WHERE sensor_id = 'blynk_V0'
ORDER BY timestamp DESC
LIMIT 100;
```

### **Alerts Table:**

When water level > threshold:
- `sensor_id` - which sensor triggered
- `water_level` - the alert value
- `timestamp` - when alert occurred

---

## 📊 API Endpoints

### **1. Check Scheduler Status**

**Endpoint:** `GET /api/scheduler/status`

**Response:**
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "job_name": "Fetch Blynk sensor data",
    "next_run": "2026-01-09T15:35:00",
    "interval_minutes": 5,
    "pins_monitored": ["V0", "V1"],
    "last_reading_time": "2026-01-09T15:30:00"
  }
}
```

**Test it:**
```bash
curl http://localhost:5030/api/scheduler/status
```

### **2. Get All Readings**

**Endpoint:** `GET /api/readings?limit=100`

**Parameters:**
- `limit` (optional) - Number of readings (default: 100)
- `sensor_id` (optional) - Filter by specific sensor

**Response:**
```json
{
  "readings": [
    {
      "id": 1,
      "sensor_id": "blynk_V0",
      "water_level": 75.5,
      "timestamp": "2026-01-09 15:30:00"
    },
    {
      "id": 2,
      "sensor_id": "blynk_V0",
      "water_level": 73.2,
      "timestamp": "2026-01-09 15:25:00"
    }
  ]
}
```

**Test it:**
```bash
# Get last 50 readings
curl http://localhost:5030/api/readings?limit=50

# Get readings for specific sensor
curl http://localhost:5030/api/readings?sensor_id=blynk_V0&limit=20
```

### **3. Get Latest Reading**

**Endpoint:** `GET /api/latest`

Returns the most recent reading from database.

---

## 🖥️ Dashboard Display

### **ViewDashboard Page:**

Shows recent readings with timestamps:

```
Recent Readings Table:
┌──────────────┬────────┬────────┬──────────────────┐
│ Sensor       │ Level  │ Status │ Time             │
├──────────────┼────────┼────────┼──────────────────┤
│ blynk_V0     │ 75 cm  │ High   │ 1/9/26, 3:30 PM  │
│ blynk_V0     │ 73 cm  │ High   │ 1/9/26, 3:25 PM  │
│ blynk_V1     │ 45 cm  │ Normal │ 1/9/26, 3:30 PM  │
└──────────────┴────────┴────────┴──────────────────┘
```

**Features:**
- ✅ Auto-refreshes every 5 seconds
- ✅ Shows timestamps in local format
- ✅ Color-coded status (red/green)
- ✅ All historical data visible

### **Dashboard Page:**

Shows:
- ✅ Latest reading with timestamp
- ✅ Recent readings table
- ✅ Recent alerts with timestamps
- ✅ Statistics based on all stored data

---

## 🔧 Console Logging

### **What You'll See in Flask Console:**

**On Startup:**
```
🔄 Fetching Blynk data at 2026-01-09 15:30:00
✅ Stored reading: blynk_V0 = 75.5 cm at 2026-01-09 15:30:00
✅ Stored reading: blynk_V1 = 45.2 cm at 2026-01-09 15:30:00
```

**Every Fetch Interval:**
```
🔄 Fetching Blynk data at 2026-01-09 15:35:00
✅ Stored reading: blynk_V0 = 76.3 cm at 2026-01-09 15:35:00
✅ Stored reading: blynk_V1 = 44.8 cm at 2026-01-09 15:35:00
```

**On Errors:**
```
❌ Failed to fetch V0: HTTP 401
❌ Error fetching data for V1: Connection timeout
```

---

## 📈 Data Accumulation

### **Over Time:**

With 5-minute intervals:
- **1 hour** = 12 readings per sensor
- **1 day** = 288 readings per sensor
- **1 week** = 2,016 readings per sensor
- **1 month** = ~8,640 readings per sensor

### **Example Timeline:**

```
Time        | blynk_V0 | blynk_V1
------------|----------|----------
15:00       | 70.0 cm  | 42.5 cm
15:05       | 71.2 cm  | 43.1 cm
15:10       | 72.5 cm  | 43.8 cm
15:15       | 73.8 cm  | 44.2 cm
15:20       | 75.1 cm  | 44.9 cm (Alert!)
15:25       | 76.5 cm  | 45.3 cm (Alert!)
```

---

## 🎛️ Customization

### **Monitor More Pins:**

Edit `.env`:
```env
BLYNK_PINS=V0,V1,V2,V3,V4
```

System will automatically fetch from all listed pins.

### **Change Fetch Frequency:**

Edit `.env`:
```env
# Fetch every 10 minutes
FETCH_INTERVAL_MINUTES=10

# Fetch every 1 minute (frequent)
FETCH_INTERVAL_MINUTES=1

# Fetch every 30 minutes (less frequent)
FETCH_INTERVAL_MINUTES=30
```

**Recommendation:** 5-15 minutes is optimal balance.

### **Change Alert Threshold:**

Edit `.env`:
```env
# Alert when water level > 80 cm
WATER_LEVEL_THRESHOLD=80
```

---

## 🐛 Troubleshooting

### **No Data Being Stored:**

1. **Check Blynk Token:**
   ```bash
   # Test Blynk API manually
   curl "https://blynk.cloud/external/api/get?token=YOUR_TOKEN&V0"
   ```

2. **Check Console Logs:**
   - Look for error messages
   - Verify scheduler is running

3. **Check Scheduler Status:**
   ```bash
   curl http://localhost:5030/api/scheduler/status
   ```

4. **Verify Database:**
   ```bash
   cd backendd
   python -c "
   import sqlite3
   conn = sqlite3.connect('water_alert.db')
   cursor = conn.cursor()
   cursor.execute('SELECT COUNT(*) FROM readings')
   print('Total readings:', cursor.fetchone()[0])
   conn.close()
   "
   ```

### **Scheduler Not Running:**

- Flask must be running for scheduler to work
- Check for errors in Flask startup logs
- Verify APScheduler is installed: `pip list | grep APScheduler`

### **Old Data:**

If you see old timestamps:
- Scheduler might have stopped
- Check Flask console for errors
- Restart Flask: `python app.py`

---

## 🧪 Testing

### **Step 1: Start Flask**
```bash
cd backendd
python app.py
```

Expected output:
```
 * Serving Flask app 'app'
 * Debug mode: on
🔄 Fetching Blynk data at 2026-01-09 15:30:00
✅ Stored reading: blynk_V0 = 75.5 cm at 2026-01-09 15:30:00
```

### **Step 2: Check Scheduler Status**
```bash
curl http://localhost:5030/api/scheduler/status
```

Should show:
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "next_run": "2026-01-09T15:35:00",
    ...
  }
}
```

### **Step 3: Wait for Next Fetch**

After FETCH_INTERVAL_MINUTES, console shows:
```
🔄 Fetching Blynk data at 2026-01-09 15:35:00
✅ Stored reading: blynk_V0 = 76.0 cm at 2026-01-09 15:35:00
```

### **Step 4: View on Dashboard**

1. Open: `http://localhost:5030/hehehe#view-dashboard`
2. See recent readings table
3. ✅ Timestamps show automatic fetches
4. ✅ Data updates every 5 seconds (frontend refresh)

---

## 📊 Data Analysis

### **Query Historical Data:**

```bash
cd backendd
python -c "
import sqlite3
conn = sqlite3.connect('water_alert.db')
cursor = conn.cursor()

# Get readings from last hour
cursor.execute('''
    SELECT sensor_id, water_level, timestamp
    FROM readings
    WHERE datetime(timestamp) > datetime('now', '-1 hour')
    ORDER BY timestamp DESC
''')

for row in cursor.fetchall():
    print(row)

conn.close()
"
```

### **Average Water Level:**

```bash
python -c "
import sqlite3
conn = sqlite3.connect('water_alert.db')
cursor = conn.cursor()

cursor.execute('''
    SELECT sensor_id,
           AVG(water_level) as avg_level,
           MIN(water_level) as min_level,
           MAX(water_level) as max_level,
           COUNT(*) as reading_count
    FROM readings
    GROUP BY sensor_id
''')

for row in cursor.fetchall():
    print(f'{row[0]}: Avg={row[1]:.2f}, Min={row[2]:.2f}, Max={row[3]:.2f}, Count={row[4]}')

conn.close()
"
```

---

## 🔐 Security

### **Best Practices:**

1. **Never commit .env file**
   - Already in `.gitignore`
   - Keep your Blynk token secret

2. **Use environment-specific tokens**
   - Development: one token
   - Production: different token

3. **Rate Limiting**
   - Don't set FETCH_INTERVAL_MINUTES too low
   - Respect Blynk API rate limits
   - Recommended minimum: 1 minute

---

## 🎉 Benefits

### **Automatic System:**

✅ **No manual fetching** - Runs in background
✅ **Complete history** - All data stored with timestamps
✅ **Real-time alerts** - Automatic threshold checking
✅ **Reliable** - Runs as long as Flask is running
✅ **Scalable** - Monitor multiple pins easily
✅ **Observable** - Console logs + status API

### **Data Integrity:**

✅ **Every reading timestamped** - Know exactly when data was captured
✅ **No data loss** - Continuous storage
✅ **Historical analysis** - Query past data anytime
✅ **Trend detection** - See patterns over time

---

## 🚀 Ready to Use!

Your system is now automatically fetching and storing data:

1. ✅ **Scheduler running** - Background task active
2. ✅ **Data fetching** - Every 5 minutes (configurable)
3. ✅ **Timestamps stored** - All readings dated
4. ✅ **Dashboard showing** - Real-time display
5. ✅ **Alerts working** - Automatic threshold monitoring

**Just keep Flask running and your data flows automatically!** 🔄✨

---

## 📞 Support

**Check if system is working:**
```bash
# 1. Scheduler status
curl http://localhost:5030/api/scheduler/status

# 2. Recent readings
curl http://localhost:5030/api/readings?limit=10

# 3. Latest reading
curl http://localhost:5030/api/latest
```

**All three should return data if system is working correctly!**

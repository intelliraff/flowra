# 🚀 Webhook Quick Start Guide

## ✅ What's Been Implemented

Your Flowra system now has **complete webhook integration** with automatic data display!

---

## 🔌 New Flask Endpoints

### 1. Webhook Receiver
**Endpoint:** `POST /api/webhook/blynk`

Receives sensor data from Blynk automations when datastream updates.

**Test it:**
```bash
curl -X POST http://localhost:5030/api/webhook/blynk \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "V0",
    "value": 85.5,
    "device_id": "test_device"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook data received and stored",
  "data": {
    "sensor_id": "test_device_V0",
    "water_level": 85.5,
    "pin": "V0",
    "alert_created": true,
    "timestamp": "2026-01-09T15:30:00"
  }
}
```

### 2. Latest Reading API
**Endpoint:** `GET /api/latest`

Returns the most recent water level reading from database.

**Test it:**
```bash
curl http://localhost:5030/api/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "sensor_id": "test_device_V0",
    "water_level": 85.5,
    "timestamp": "2026-01-09 15:30:00"
  }
}
```

---

## 📊 React Dashboard Integration

### Live Data Display

The **View Dashboard** page now shows:

1. **Value Display Widget**
   - Shows latest water level from `/api/latest`
   - Auto-refreshes every 5 seconds
   - "Live from webhook" indicator
   - Timestamp of last update

2. **Auto-Refresh System**
   - Fetches new data every 5 seconds
   - No manual refresh needed
   - Real-time updates when webhook receives data

**Access:** `http://localhost:5030/hehehe#view-dashboard`

---

## 🧪 Testing the Integration

### Step 1: Send Test Webhook Data

Use PowerShell (Windows):
```powershell
$body = @{
    pin = "V0"
    value = 92.3
    device_id = "flowra_sensor_001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5030/api/webhook/blynk" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing
```

Or use curl (Mac/Linux):
```bash
curl -X POST http://localhost:5030/api/webhook/blynk \
  -H "Content-Type: application/json" \
  -d '{"pin":"V0","value":92.3,"device_id":"flowra_sensor_001"}'
```

### Step 2: Verify Data is Stored

Check latest reading:
```bash
curl http://localhost:5030/api/latest
```

Or check database directly:
```bash
cd backendd
python -c "
import sqlite3
conn = sqlite3.connect('water_alert.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1')
print(cursor.fetchone())
conn.close()
"
```

### Step 3: View on Dashboard

1. Open: `http://localhost:5030/hehehe#view-dashboard`
2. Look at **Value Display Widget**
3. Should show your test data
4. Watch it auto-refresh every 5 seconds

---

## 🔗 Connect Real Blynk Device

### Quick Setup (3 Steps)

1. **Expose your Flask backend:**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 5030

   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   ```

2. **Create Blynk Automation:**
   - Go to: https://blynk.cloud/
   - Automations → Create Automation
   - **When:** Datastream V0 changes
   - **Then:** Webhook
   - **URL:** `https://abc123.ngrok.io/api/webhook/blynk`
   - **Method:** POST
   - **Body:**
     ```json
     {
       "pin": "/pin/",
       "value": "/pin/",
       "device_id": "/device_id/"
     }
     ```

3. **Test from Blynk App:**
   - Update V0 value in Blynk mobile app
   - Check your dashboard - should update automatically!

---

## 📱 Real-Time Data Flow

```
Blynk Sensor (V0)
    ↓ (datastream update)
Blynk Automation Triggered
    ↓ (HTTP POST webhook)
Flask /api/webhook/blynk
    ↓ (store in database)
SQLite readings table
    ↓ (query every 5 seconds)
Flask /api/latest
    ↓ (fetch & display)
React Dashboard Widget
```

---

## 🎯 What Happens Automatically

1. **Sensor updates in Blynk** → Value changes on V0
2. **Blynk webhook fires** → Sends data to your Flask endpoint
3. **Flask stores data** → Saves to SQLite database
4. **Alert check** → Creates alert if water_level > 70
5. **Dashboard refreshes** → Fetches latest data every 5 seconds
6. **Widget updates** → Shows new value with timestamp

**No manual intervention required!** 🎉

---

## 📋 Verify Everything Works

✅ **Webhook endpoint responds:**
```bash
curl -X POST http://localhost:5030/api/webhook/blynk \
  -H "Content-Type: application/json" \
  -d '{"pin":"V0","value":75}'
```

✅ **Latest API returns data:**
```bash
curl http://localhost:5030/api/latest
```

✅ **Dashboard shows live data:**
- Visit: `http://localhost:5030/hehehe#view-dashboard`
- Value Display widget shows latest reading
- "Live from webhook" indicator visible
- Timestamp updates

✅ **Auto-refresh working:**
- Send new webhook data
- Wait 5 seconds
- Dashboard updates automatically

---

## 🐛 Troubleshooting

**Dashboard not updating?**
- Check browser console for errors
- Verify `/api/latest` returns data
- Make sure auto-refresh isn't blocked

**Webhook not receiving data?**
- Check Flask logs for POST requests
- Verify ngrok tunnel is active
- Test with curl first

**Data not in database?**
- Check Flask logs for errors
- Verify database file exists
- Test `/api/latest` endpoint

---

## 📚 Full Documentation

For complete Blynk webhook setup instructions, see:
`backendd/BLYNK_WEBHOOK_SETUP.md`

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Webhook endpoint returns `{"success": true}`
✅ `/api/latest` shows newest reading
✅ Dashboard "Value Display" has "Live from webhook" badge
✅ Timestamp updates every 5 seconds
✅ New webhook data appears automatically
✅ Alerts created when level > 70

**Congratulations! Your Flowra system is now fully integrated with Blynk webhooks!** 🌊✨

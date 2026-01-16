# Blynk Webhook Setup Guide

This guide explains how to configure Blynk to automatically send sensor data to your Flowra backend using webhooks.

## 🎯 Overview

When a datastream in Blynk updates (e.g., water level sensor changes), Blynk can automatically send the new value to your Flask backend via webhook. This eliminates the need for manual API polling.

---

## 🔧 Flask Webhook Endpoint

Your Flask backend now has a webhook endpoint ready to receive Blynk data:

**Endpoint:** `POST /api/webhook/blynk`

**Expected Payload:**
```json
{
  "pin": "V0",
  "value": 75.5,
  "device_id": "device123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook data received and stored",
  "data": {
    "sensor_id": "device123_V0",
    "water_level": 75.5,
    "pin": "V0",
    "alert_created": true,
    "timestamp": "2026-01-09T15:30:00"
  }
}
```

---

## 📝 Step-by-Step: Configure Blynk Webhook

### Step 1: Expose Your Flask Backend

If running locally, use **ngrok** or **localtunnel** to expose your Flask app:

```bash
# Install ngrok (if not already installed)
# Download from: https://ngrok.com/download

# Start ngrok tunnel
ngrok http 5030
```

You'll get a public URL like: `https://abc123.ngrok.io`

Your webhook URL will be: `https://abc123.ngrok.io/api/webhook/blynk`

### Step 2: Login to Blynk Console

1. Go to [Blynk Console](https://blynk.cloud/)
2. Login with your account
3. Select your project/device

### Step 3: Create Automation (Webhook)

1. **Navigate to Automations**
   - In Blynk Console, click on **"Automations"** in the left sidebar
   - Click **"+ Create Automation"**

2. **Set Trigger**
   - **When**: Select "Datastream value changes"
   - **Datastream**: Select your water level pin (e.g., V0)
   - **Condition**: "Any value" or set specific conditions

3. **Set Action**
   - **Then**: Select "Webhook"
   - **URL**: `https://your-ngrok-url.ngrok.io/api/webhook/blynk`
   - **Method**: POST
   - **Content Type**: application/json

4. **Configure Webhook Body**

   Use this JSON template:
   ```json
   {
     "pin": "V0",
     "value": /pin/,
     "device_id": "/device_id/"
   }
   ```

   **Note:** Blynk uses special placeholders:
   - `/pin/` - Automatically replaced with the datastream pin
   - `/device_id/` - Automatically replaced with your device ID
   - You can also use `/pin.0/`, `/pin.1/` for specific values

5. **Save Automation**
   - Give it a name: "Water Level Webhook"
   - Enable the automation
   - Click **Save**

---

## 🧪 Testing the Webhook

### Method 1: Update Sensor in Blynk App

1. Open your Blynk mobile app
2. Change the water level value on pin V0
3. Check your Flask backend logs - you should see the webhook received

### Method 2: Manual Test with curl

```bash
curl -X POST http://localhost:5030/api/webhook/blynk \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "V0",
    "value": 85.3,
    "device_id": "test_device"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook data received and stored"
}
```

### Method 3: Check Database

```bash
# Connect to your SQLite database
cd backendd
python -c "
import sqlite3
conn = sqlite3.connect('water_alert.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM readings ORDER BY timestamp DESC LIMIT 5')
for row in cursor.fetchall():
    print(row)
conn.close()
"
```

---

## 📊 View Live Data on Dashboard

Your React dashboard automatically displays webhook data:

1. Visit: `http://localhost:5030/hehehe#view-dashboard`
2. Check the **"Value Display"** widget
3. You'll see:
   - Current water level (auto-updates every 5 seconds)
   - "Live from webhook" indicator
   - Timestamp of last update

**Auto-Refresh:** The dashboard fetches latest data every 5 seconds from `/api/latest` endpoint.

---

## 🔐 Security Best Practices

### 1. Add Authentication (Optional)

Modify the webhook endpoint to require a secret token:

```python
@app.route("/api/webhook/blynk", methods=["POST"])
def blynk_webhook():
    # Verify secret token
    auth_token = request.headers.get('Authorization')
    if auth_token != f"Bearer {os.getenv('WEBHOOK_SECRET')}":
        return jsonify({"error": "Unauthorized"}), 401

    # ... rest of code
```

Add to `.env`:
```
WEBHOOK_SECRET=your_random_secret_here
```

Then configure in Blynk webhook headers:
```
Authorization: Bearer your_random_secret_here
```

### 2. Rate Limiting

Install flask-limiter:
```bash
pip install flask-limiter
```

Add to `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route("/api/webhook/blynk", methods=["POST"])
@limiter.limit("60 per minute")
def blynk_webhook():
    # ... code
```

---

## 🐛 Troubleshooting

### Webhook Not Triggering

1. **Check Automation Status**: Make sure automation is enabled in Blynk Console
2. **Verify URL**: Ensure ngrok/public URL is correct and accessible
3. **Check Blynk Logs**: View automation logs in Blynk Console
4. **Test Manually**: Use curl to verify endpoint works

### Data Not Appearing in Dashboard

1. **Check Flask Logs**: Look for webhook POST requests
2. **Verify Database**: Check if readings are being stored
3. **Check API Response**: Visit `http://localhost:5030/api/latest`
4. **Browser Console**: Check for JavaScript errors

### ngrok Session Expired

ngrok free tier sessions expire after 2 hours. Restart ngrok:
```bash
ngrok http 5030
# Update webhook URL in Blynk with new ngrok URL
```

---

## 🚀 Production Deployment

For production, replace ngrok with a proper domain:

1. **Deploy Flask to cloud** (Heroku, AWS, DigitalOcean, etc.)
2. **Get permanent domain** (e.g., `https://flowra.yourdomain.com`)
3. **Update webhook URL** in Blynk to: `https://flowra.yourdomain.com/api/webhook/blynk`
4. **Enable HTTPS** (required by Blynk for webhooks)
5. **Set up monitoring** to track webhook deliveries

---

## 📋 Quick Reference

| Component | URL/Command |
|-----------|-------------|
| **Webhook Endpoint** | `POST /api/webhook/blynk` |
| **Latest Reading API** | `GET /api/latest` |
| **View Dashboard** | `http://localhost:5030/hehehe#view-dashboard` |
| **Start ngrok** | `ngrok http 5030` |
| **Test Webhook** | See "Testing the Webhook" section |

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ Flask logs show: `POST /api/webhook/blynk` requests
- ✅ Database `readings` table has new entries
- ✅ `/api/latest` returns the newest reading
- ✅ Dashboard "Value Display" widget shows "Live from webhook"
- ✅ Water level updates automatically when sensor changes in Blynk

---

## 💡 Advanced: Multiple Sensors

To handle multiple sensors/pins, modify the automation:

```json
{
  "pin": "/pin/",
  "value": "/pin/",
  "device_id": "/device_id/",
  "device_name": "/device_name/"
}
```

Your Flask endpoint already handles multiple sensors with dynamic `sensor_id` generation.

---

## 📞 Support

If you encounter issues:

1. Check Flask console for error messages
2. Verify Blynk automation logs
3. Test endpoint manually with curl
4. Check database for stored readings

**Happy monitoring!** 🌊✨

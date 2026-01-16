# 💓 Device Heartbeat System

## Overview

The heartbeat system prevents storing stale/cached Blynk values when your ESP32 device is offline. The system checks if the device is actively sending data before storing sensor readings.

---

## How It Works

1. **ESP32 updates V9** with current timestamp every time it sends sensor data
2. **Flask checks V9** before fetching sensor pins
3. **If heartbeat is fresh** (< 15 seconds old): Fetch and store sensor data
4. **If heartbeat is stale** (> 15 seconds old): Skip storing, log "Device OFFLINE"

---

## Backend Configuration

### `.env` Settings:

```env
# Heartbeat pin - ESP32 updates this with Unix timestamp
BLYNK_HEARTBEAT_PIN=V9

# Timeout in seconds (10-15 recommended)
BLYNK_HEARTBEAT_TIMEOUT=15

# Your sensor data pins
BLYNK_PINS=V0
```

### What Happens:

**Device Online:**
```
[INFO] Fetching Blynk data at 2026-01-09 18:30:00
[ONLINE] Device ONLINE — Heartbeat is 3.2s fresh. Fetching sensor data...
[LIVE] Stored reading: blynk_V0 = 15.3 cm at 2026-01-09 18:30:01
```

**Device Offline:**
```
[INFO] Fetching Blynk data at 2026-01-09 18:35:00
[OFFLINE] Device OFFLINE — Heartbeat is 45.7s old (threshold: 15s). Ignoring cached Blynk values.
```

---

## ESP32 Setup

### Option 1: Update Heartbeat on Every Data Send

```cpp
#define BLYNK_TEMPLATE_ID "TMPL3CgFlUliY"
#define BLYNK_TEMPLATE_NAME "water level monitor"
#define BLYNK_AUTH_TOKEN "your_token_here"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>

// Heartbeat pin
#define HEARTBEAT_PIN V9
#define WATER_LEVEL_PIN V0

void sendSensorData() {
    // Read your sensor
    float waterLevel = readWaterLevelSensor();

    // Send sensor data
    Blynk.virtualWrite(WATER_LEVEL_PIN, waterLevel);

    // Update heartbeat with current Unix timestamp
    unsigned long currentTime = millis() / 1000; // Convert ms to seconds
    Blynk.virtualWrite(HEARTBEAT_PIN, currentTime);

    Serial.printf("Sent: Water=%.1f cm, Heartbeat=%lu\n", waterLevel, currentTime);
}

void setup() {
    Serial.begin(115200);
    Blynk.begin(BLYNK_AUTH_TOKEN, "YourWiFi", "YourPassword");
}

void loop() {
    Blynk.run();

    // Send data every 10 seconds
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 10000) {
        sendSensorData();
        lastSend = millis();
    }
}
```

### Option 2: Use millis() as Heartbeat

```cpp
void sendSensorData() {
    float waterLevel = readWaterLevelSensor();
    Blynk.virtualWrite(V0, waterLevel);

    // Use millis() directly (simpler but not Unix timestamp)
    Blynk.virtualWrite(V9, millis() / 1000);
}
```

### Option 3: Use Timer for Automatic Updates

```cpp
BlynkTimer timer;

void sendHeartbeat() {
    unsigned long currentTime = millis() / 1000;
    Blynk.virtualWrite(V9, currentTime);
}

void sendSensorData() {
    float waterLevel = readWaterLevelSensor();
    Blynk.virtualWrite(V0, waterLevel);
    sendHeartbeat(); // Update heartbeat with sensor data
}

void setup() {
    Serial.begin(115200);
    Blynk.begin(BLYNK_AUTH_TOKEN, "YourWiFi", "YourPassword");

    // Send sensor data every 10 seconds
    timer.setInterval(10000L, sendSensorData);
}

void loop() {
    Blynk.run();
    timer.run();
}
```

---

## Blynk Configuration

### Add Heartbeat Virtual Pin:

1. Open Blynk Console → Your Device
2. Go to **Datastreams**
3. Click **+ New Datastream** → **Virtual Pin**
4. Configure:
   - **Pin:** V9
   - **Name:** Heartbeat
   - **Data Type:** Integer or Double
   - **Min:** 0
   - **Max:** 999999999
5. Save

---

## Testing

### 1. Verify Heartbeat is Working:

```bash
# Check heartbeat value
curl "https://blynk.cloud/external/api/get?token=YOUR_TOKEN&V9"

# Should return current timestamp (e.g., 1736445600)
```

### 2. Check Device Status:

Watch Flask console:

**Device sending data:**
```
[ONLINE] Device ONLINE — Heartbeat is 2.3s fresh. Fetching sensor data...
[LIVE] Stored reading: blynk_V0 = 15.3 cm
```

**Device stopped:**
```
[OFFLINE] Device OFFLINE — Heartbeat is 30.5s old (threshold: 15s). Ignoring cached Blynk values.
```

### 3. Test Offline Behavior:

1. Turn off your ESP32
2. Wait 20 seconds
3. Check Flask console - should see "[OFFLINE]" messages
4. Database should NOT have new entries
5. Turn on ESP32
6. Should see "[ONLINE]" messages
7. Database gets new readings

---

## Troubleshooting

### Problem: Always shows "Device OFFLINE"

**Cause:** Heartbeat pin not being updated

**Solutions:**
- Verify ESP32 code calls `Blynk.virtualWrite(V9, millis()/1000)`
- Check Blynk console - V9 datastream should exist
- Test manually: `curl` the V9 pin, should return a recent number

### Problem: Heartbeat value is wrong

**Cause:** ESP32 using millis() instead of Unix timestamp

**Solution:** This is fine! The system checks age (current_time - heartbeat), so millis() works as long as it's updated regularly.

### Problem: Still storing stale data

**Cause:** Heartbeat timeout too high

**Solution:** Reduce timeout in `.env`:
```env
BLYNK_HEARTBEAT_TIMEOUT=10  # Try 10 seconds
```

---

## Advanced: Using Real Unix Timestamp

If you want to use real Unix timestamps (seconds since 1970):

```cpp
#include <time.h>

// Sync time with NTP server
void syncTime() {
    configTime(0, 0, "pool.ntp.org");
    time_t now;
    while (time(&now) < 24 * 3600) {
        delay(100);
    }
    Serial.println("Time synced");
}

void sendSensorData() {
    float waterLevel = readWaterLevelSensor();
    Blynk.virtualWrite(V0, waterLevel);

    // Send real Unix timestamp
    time_t now = time(nullptr);
    Blynk.virtualWrite(V9, now);
}

void setup() {
    Serial.begin(115200);
    WiFi.begin("YourWiFi", "YourPassword");
    while (WiFi.status() != WL_CONNECTED) delay(100);

    syncTime(); // Sync with NTP
    Blynk.begin(BLYNK_AUTH_TOKEN, "YourWiFi", "YourPassword");
}
```

---

## Benefits

✅ **No stale data** - Only stores readings from online device
✅ **Automatic detection** - No manual intervention
✅ **Clear logging** - Shows device status in console
✅ **Configurable timeout** - Adjust sensitivity
✅ **Production safe** - Minimal code changes
✅ **No database changes** - Works with existing schema

---

## Summary

1. **Add V9 datastream** in Blynk console
2. **Update ESP32 code** to write to V9 when sending data
3. **Configure .env** with `BLYNK_HEARTBEAT_PIN=V9`
4. **Restart Flask** - System now checks heartbeat before storing
5. **Monitor logs** - See "[ONLINE]" or "[OFFLINE]" status

Your system will now only store fresh, live data from your device! 💓✨

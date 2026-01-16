# Blynk Value Encoding/Decoding System

## Problem Statement

**Issue:** Blynk only supports integer values or applies min/max/step constraints that round or clamp sensor readings, resulting in loss of precision (e.g., 12.34 cm becomes 12 cm).

**Solution:** Encode values before sending to Blynk, then decode them in the Flask backend.

---

## How It Works

### Overview

```
ESP32 Sensor → Encode (×100) → Blynk → Webhook → Decode (÷100) → Database
   12.34 cm        1234         1234      1234      12.34 cm      ✓ Stored
```

### Encoding (ESP32 Side)

**Rule:** Multiply sensor value by **100** before sending to Blynk.

**Why 100?** Preserves 2 decimal places as integers.

**Example:**
- Real value: `12.34 cm`
- Encoded: `12.34 × 100 = 1234`
- Sent to Blynk: `1234` (integer)

### Decoding (Flask Side)

**Rule:** Divide incoming Blynk value by **100.0** before storing.

**Example:**
- Received from Blynk: `1234`
- Decoded: `1234 ÷ 100.0 = 12.34`
- Stored in database: `12.34 cm`

---

## Implementation Details

### 1. ESP32 Code Changes

**File:** `ESP32_ENCODING_EXAMPLE.ino`

**Key Function:**
```cpp
void sendSensorData() {
  // Read real sensor value
  float realWaterLevel = calculateWaterLevel(distance);

  // ENCODE: Multiply by 100
  int encodedValue = (int)(realWaterLevel * 100);

  // Log for verification
  Serial.print("Real water level: ");
  Serial.print(realWaterLevel, 2);
  Serial.print(" cm → Sending encoded value: ");
  Serial.println(encodedValue);

  // Send encoded value to Blynk
  Blynk.virtualWrite(V0, encodedValue);

  // Update heartbeat
  Blynk.virtualWrite(V9, millis() / 1000);
}
```

**What Changed:**
- ✅ Sensor reading is multiplied by 100
- ✅ Cast to integer for Blynk compatibility
- ✅ Clear logging shows both real and encoded values

**What Stayed the Same:**
- ❌ No changes to WiFi connection
- ❌ No changes to sensor pins or hardware
- ❌ No changes to Blynk authentication
- ❌ No changes to heartbeat mechanism

---

### 2. Flask Webhook Changes

**File:** `backendd/app.py`

**Endpoint:** `POST /api/webhook/blynk`

**Key Changes:**
```python
@app.route("/api/webhook/blynk", methods=["POST"])
def blynk_webhook():
    # Extract encoded value from Blynk
    encoded_value = float(webhook_data.get('value'))

    # DECODE: Divide by 100 to restore precision
    decoded_value = encoded_value / 100.0

    # Log for verification
    print(f"[WEBHOOK] Received encoded value: {encoded_value} → Decoded: {decoded_value} cm")

    # Store decoded value in database
    conn.execute(
        "INSERT INTO readings(sensor_id, water_level) VALUES (?, ?)",
        (device_id, decoded_value)  # ← Stores 12.34, not 1234
    )

    # Check alerts using decoded value
    if decoded_value > THRESHOLD:
        # Alert uses real value (e.g., 21.5 cm > 21 cm threshold)
        conn.execute(
            "INSERT INTO alerts(sensor_id, water_level) VALUES (?, ?)",
            (device_id, decoded_value)
        )
```

**What Changed:**
- ✅ Incoming value divided by 100 before storage
- ✅ Alerts use decoded value for threshold comparison
- ✅ Clear logging shows encoding → decoding transformation

**What Stayed the Same:**
- ❌ No database schema changes
- ❌ No changes to existing API endpoints
- ❌ No changes to frontend data display

---

### 3. Background Fetch Changes

**File:** `backendd/app.py`

**Function:** `fetch_blynk_data_background()`

**Key Changes:**
```python
def fetch_blynk_data_background():
    # Fetch from Blynk API
    response = requests.get(url, timeout=10)

    if response.status_code == 200:
        # Blynk returns encoded value
        encoded_value = float(response.text.strip())

        # DECODE: Divide by 100
        decoded_value = encoded_value / 100.0

        # Log for verification
        print(f"[DECODE] Received encoded value: {encoded_value} → Decoded: {decoded_value} cm")

        # Store decoded value
        conn.execute(
            "INSERT INTO readings(sensor_id, water_level, timestamp) VALUES (?, ?, ?)",
            (sensor_id, decoded_value, timestamp)  # ← Stores 12.34, not 1234
        )

        # Check alerts using decoded value
        if decoded_value > THRESHOLD:
            conn.execute(
                "INSERT INTO alerts(sensor_id, water_level, timestamp) VALUES (?, ?, ?)",
                (sensor_id, decoded_value, timestamp)
            )
```

**What Changed:**
- ✅ API response divided by 100 before storage
- ✅ Alert threshold uses decoded value
- ✅ Clear logging for debugging

---

## Verification

### Expected Behavior

#### ESP32 Serial Monitor Output:
```
Real water level: 12.34 cm → Sending encoded value: 1234
Heartbeat timestamp sent: 12543
---
Real water level: 15.67 cm → Sending encoded value: 1567
Heartbeat timestamp sent: 12548
---
Real water level: 21.50 cm → Sending encoded value: 2150
Heartbeat timestamp sent: 12553
---
```

#### Flask Console Output:
```
[ONLINE] Device ONLINE — Heartbeat is 2.3s fresh. Fetching sensor data...
[DECODE] Received encoded value: 1234.0 → Decoded: 12.34 cm
[LIVE] Stored reading: blynk_V0 = 12.34 cm at 2026-01-10 15:30:45
---
[WEBHOOK] Received encoded value: 1567 → Decoded: 15.67 cm
[WEBHOOK] Stored: Device=ESP32, Value=15.67 cm, Datastream=V0
---
[WEBHOOK] Received encoded value: 2150 → Decoded: 21.5 cm
[ALERT] Water level 21.5 cm exceeds threshold 21 cm
```

#### Database Content:
```sql
SELECT sensor_id, water_level, timestamp FROM readings ORDER BY timestamp DESC LIMIT 5;

-- Results:
-- blynk_V0 | 21.50 | 2026-01-10 15:31:00
-- blynk_V0 | 15.67 | 2026-01-10 15:30:55
-- blynk_V0 | 12.34 | 2026-01-10 15:30:50
-- blynk_V0 | 10.23 | 2026-01-10 15:30:45
-- blynk_V0 | 8.91  | 2026-01-10 15:30:40
```

#### Frontend Dashboard Display:
```
Latest Water Level: 21.50 cm
Status: ⚠️ High Water Level Alert
Last Updated: 2 seconds ago
```

---

## Testing Procedure

### Step 1: Upload ESP32 Code
1. Open `ESP32_ENCODING_EXAMPLE.ino` in Arduino IDE
2. Update WiFi credentials (`ssid`, `pass`)
3. Upload to ESP32
4. Open Serial Monitor (115200 baud)
5. Verify logs show: `Real water level: X.XX cm → Sending encoded value: XXX`

### Step 2: Verify Blynk Dashboard
1. Open Blynk web dashboard or mobile app
2. Look at V0 datastream value
3. **Expected:** Large integer values (e.g., 1234, 1567)
4. **These are encoded values** — this is correct!

### Step 3: Verify Flask Backend
1. Run `python app.py` in `backendd/` directory
2. Watch console logs
3. **Expected:** Logs show `[DECODE] Received encoded value: XXXX → Decoded: XX.XX cm`
4. Check database: `SELECT * FROM readings ORDER BY timestamp DESC LIMIT 5;`
5. **Expected:** `water_level` column shows decimal values (e.g., 12.34, 15.67)

### Step 4: Verify Frontend
1. Open browser to `http://localhost:5030`
2. Navigate to Dashboard or View Dashboard
3. **Expected:** Water level displays with decimals (e.g., "12.34 cm")
4. **NOT:** Large integer values (e.g., "1234 cm")

### Step 5: Verify Alerts
1. Manually change water level to exceed threshold (e.g., 21+ cm)
2. Check Flask console for: `[ALERT] Water level XX.XX cm exceeds threshold 21 cm`
3. Check database: `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 1;`
4. **Expected:** Alert shows decoded value (e.g., 21.50, not 2150)

---

## Troubleshooting

### Problem: Dashboard shows large values (e.g., 1234 cm)

**Cause:** Frontend is displaying raw encoded values from Blynk API.

**Fix:** Ensure frontend fetches data from Flask endpoints (`/api/latest`, `/api/readings`), not directly from Blynk.

### Problem: Database has integer values instead of decimals

**Cause:** Flask is not decoding values.

**Fix:**
1. Check Flask console logs for `[DECODE]` messages
2. Verify `decoded_value = encoded_value / 100.0` line exists
3. Restart Flask: `python app.py`

### Problem: ESP32 not sending data

**Cause:** Encoding might cause buffer overflow or invalid value.

**Fix:**
1. Check Serial Monitor for sensor readings
2. Verify `encodedValue` calculation: `int encodedValue = (int)(realWaterLevel * 100);`
3. Ensure `SCALE_FACTOR` is set to `100`

### Problem: Alerts trigger at wrong thresholds

**Cause:** Threshold comparison uses encoded values.

**Fix:** Verify alert logic uses `decoded_value`, not `encoded_value`:
```python
if decoded_value > THRESHOLD:  # ← Correct (uses 21, not 2100)
```

### Problem: Heartbeat still shows device offline

**Cause:** Heartbeat mechanism is independent of encoding.

**Fix:** Verify ESP32 sends heartbeat: `Blynk.virtualWrite(V9, millis() / 1000);`

---

## Important Notes

### ✅ What Works Now
- Full precision sensor data (2 decimal places)
- No data loss through Blynk
- No Blynk datastream configuration changes needed
- Alerts work correctly with real values
- Frontend displays accurate readings
- Database stores proper decimal values

### ❌ What NOT to Do
- Don't modify Blynk datastream min/max/step settings
- Don't change database schema
- Don't change existing API endpoint paths
- Don't remove heartbeat mechanism
- Don't use different scale factors for different sensors

### 🔄 Future Changes
If you need different precision:
- **For 3 decimal places:** Use scale factor 1000
- **For 1 decimal place:** Use scale factor 10

**Example:**
```cpp
// 3 decimal places: 12.345 cm → 12345
#define SCALE_FACTOR 1000
int encodedValue = (int)(realWaterLevel * SCALE_FACTOR);
```

```python
# Flask decoding for 3 decimal places
decoded_value = encoded_value / 1000.0
```

---

## Summary

| Component | Change | Purpose |
|-----------|--------|---------|
| ESP32 | Multiply by 100 | Encode decimals as integers |
| Blynk | No changes | Transparent transmission |
| Flask Webhook | Divide by 100 | Decode to restore precision |
| Background Fetch | Divide by 100 | Decode API responses |
| Database | No schema changes | Stores decoded values |
| Frontend | No changes | Displays decoded values |
| Alerts | Uses decoded values | Correct threshold comparison |

**Result:** Full-precision sensor data throughout the entire system! 🎉

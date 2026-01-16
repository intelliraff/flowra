# Value Encoding/Decoding - Quick Start Guide

## 🎯 Goal
Preserve full sensor precision (e.g., 12.34 cm) through Blynk's integer-only constraints.

---

## 📋 Checklist

### ✅ Step 1: Update ESP32 Code (5 minutes)

**File:** `ESP32_ENCODING_EXAMPLE.ino`

**What to do:**
1. Open the provided ESP32 code
2. Update WiFi credentials:
   ```cpp
   char ssid[] = "YOUR_WIFI_SSID";     // ← Your WiFi name
   char pass[] = "YOUR_WIFI_PASSWORD"; // ← Your WiFi password
   ```
3. Verify pin configuration matches your hardware:
   ```cpp
   #define TRIG_PIN 5    // Ultrasonic trigger pin
   #define ECHO_PIN 18   // Ultrasonic echo pin
   ```
4. Upload to ESP32
5. Open Serial Monitor (115200 baud)
6. **Verify:** You see logs like:
   ```
   Real water level: 12.34 cm → Sending encoded value: 1234
   Heartbeat timestamp sent: 12543
   ```

**Key code change:**
```cpp
// OLD (loses precision):
float waterLevel = calculateWaterLevel(distance);
Blynk.virtualWrite(V0, waterLevel);  // Sends 12.34 → Blynk rounds to 12

// NEW (preserves precision):
float waterLevel = calculateWaterLevel(distance);
int encodedValue = (int)(waterLevel * 100);  // 12.34 * 100 = 1234
Blynk.virtualWrite(V0, encodedValue);        // Sends 1234 → Blynk stores exactly 1234
```

---

### ✅ Step 2: Flask Backend (Already Done! ✓)

**Files Updated:**
- `backendd/app.py` - Webhook and background fetch now decode values

**What changed:**
```python
# Webhook endpoint now decodes:
encoded_value = float(webhook_data.get('value'))  # 1234 from Blynk
decoded_value = encoded_value / 100.0              # 1234 / 100 = 12.34
# Stores 12.34 in database ✓

# Background fetch also decodes:
encoded_value = float(response.text.strip())  # 1234 from Blynk API
decoded_value = encoded_value / 100.0         # 12.34
# Stores 12.34 in database ✓
```

**Verification:**
1. Run Flask: `cd backendd && python app.py`
2. Check console for:
   ```
   [WEBHOOK] Received encoded value: 1234 → Decoded: 12.34 cm
   [LIVE] Stored reading: blynk_V0 = 12.34 cm
   ```

---

### ✅ Step 3: Verify Database (2 minutes)

**Check stored values:**
```bash
cd backendd
sqlite3 water_alert.db
```

```sql
-- View latest readings
SELECT sensor_id, water_level, timestamp
FROM readings
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected output:**
```
blynk_V0 | 12.34 | 2026-01-10 15:30:45
blynk_V0 | 15.67 | 2026-01-10 15:30:40
blynk_V0 | 21.50 | 2026-01-10 15:30:35
```

**✓ Success:** Values have decimals (12.34, not 1234)
**✗ Problem:** Values are large integers (1234) → Flask not decoding, check app.py

---

### ✅ Step 4: Verify Frontend (2 minutes)

**Open browser:**
```
http://localhost:5030
```

**Navigate to:** Dashboard or View Dashboard

**Expected display:**
```
Latest Water Level: 12.34 cm    ← Has decimals ✓
Status: Normal
Last Updated: 3 seconds ago
```

**If you see "1234 cm":**
- Problem: Frontend is fetching from Blynk API directly
- Fix: Ensure frontend calls Flask endpoints (`/api/latest`, `/api/readings`)

---

## 🔍 Testing Procedure

### Test 1: ESP32 Encoding
1. Open Serial Monitor
2. Place hand 10cm from sensor
3. **Expected log:**
   ```
   Real water level: 14.00 cm → Sending encoded value: 1400
   ```
4. **✓ Pass:** Encoded value = real value × 100

### Test 2: Blynk Dashboard
1. Open Blynk web dashboard
2. Look at V0 datastream
3. **Expected:** Large integer (e.g., 1400)
4. **✓ Pass:** This is correct! (It's the encoded value)

### Test 3: Flask Decoding
1. Check Flask console
2. **Expected log:**
   ```
   [WEBHOOK] Received encoded value: 1400 → Decoded: 14.0 cm
   ```
3. **✓ Pass:** Decoded value = encoded value ÷ 100

### Test 4: Database Storage
1. Query database:
   ```sql
   SELECT water_level FROM readings ORDER BY timestamp DESC LIMIT 1;
   ```
2. **Expected:** `14.0` (or `14.00`)
3. **✓ Pass:** Stored value is decoded (has decimals)

### Test 5: Alert Threshold
1. Move sensor to trigger alert (water level > 21 cm)
2. Check Flask console:
   ```
   [ALERT] Water level 21.5 cm exceeds threshold 21 cm
   ```
3. Check database:
   ```sql
   SELECT water_level FROM alerts ORDER BY timestamp DESC LIMIT 1;
   ```
4. **Expected:** `21.5` (not `2150`)
5. **✓ Pass:** Alert uses decoded value

---

## 🐛 Common Issues

### Issue 1: Frontend shows "1234 cm" instead of "12.34 cm"

**Cause:** Frontend fetching from Blynk API directly

**Fix:** Check frontend code - it should call:
```javascript
fetch('/api/latest')  // ✓ Correct (Flask decodes)
// NOT:
fetch('https://blynk.cloud/external/api/get?token=...&V0')  // ✗ Wrong
```

---

### Issue 2: Database has integer values

**Cause:** Flask not decoding values

**Fix:**
1. Check Flask console for `[DECODE]` or `[WEBHOOK]` logs
2. Verify these lines exist in `app.py`:
   ```python
   decoded_value = encoded_value / 100.0
   ```
3. Restart Flask: `python app.py`

---

### Issue 3: ESP32 sends nothing

**Cause:** Encoding broke the value transmission

**Fix:**
1. Check Serial Monitor for errors
2. Verify line:
   ```cpp
   int encodedValue = (int)(realWaterLevel * 100);
   ```
3. Ensure `realWaterLevel` is valid (not NaN or negative)

---

### Issue 4: Alerts trigger at wrong values

**Cause:** Threshold comparison uses encoded values

**Fix:** Verify alert logic in `app.py`:
```python
# ✓ Correct:
if decoded_value > THRESHOLD:  # 21.5 > 21 ✓

# ✗ Wrong:
if encoded_value > THRESHOLD:  # 2150 > 21 ✗
```

---

## 📊 Value Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ ESP32 Ultrasonic Sensor                                     │
│ ─────────────────────────                                   │
│ Distance measured: 9.66 cm                                  │
│ Water level: 24.00 - 9.66 = 14.34 cm                       │
│                                                             │
│ ENCODE: 14.34 * 100 = 1434                                 │
│ ─────────────────────────────                               │
│ Blynk.virtualWrite(V0, 1434)  →                            │
└─────────────────────────────────┼───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Blynk Cloud                                                 │
│ ───────────                                                 │
│ V0 = 1434 (stored as integer)                              │
│                                                             │
│ Webhook triggers → POST to Flask                           │
│ {"value": 1434, "datastreamId": "V0"}                      │
└─────────────────────────────────┼───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Flask Backend (app.py)                                      │
│ ──────────────────────                                      │
│ encoded_value = 1434                                        │
│                                                             │
│ DECODE: 1434 / 100.0 = 14.34 cm                           │
│ ─────────────────────────────                               │
│ conn.execute("INSERT INTO readings VALUES (?, ?)",         │
│              ("blynk_V0", 14.34))                          │
└─────────────────────────────────┼───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ SQLite Database (water_alert.db)                           │
│ ─────────────────────────────────                           │
│ readings table:                                             │
│ ┌────────────┬─────────────┬────────────────────────┐      │
│ │ sensor_id  │ water_level │ timestamp              │      │
│ ├────────────┼─────────────┼────────────────────────┤      │
│ │ blynk_V0   │ 14.34       │ 2026-01-10 15:30:45   │      │
│ └────────────┴─────────────┴────────────────────────┘      │
└─────────────────────────────────┼───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ React Frontend (Dashboard)                                  │
│ ──────────────────────────                                  │
│ fetch('/api/latest') →                                      │
│ {"water_level": 14.34, "sensor_id": "blynk_V0"}           │
│                                                             │
│ Display: "Water Level: 14.34 cm"                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

Your system is working correctly if:

1. **ESP32 Serial Monitor** shows:
   - `Real water level: X.XX cm → Sending encoded value: XXX`

2. **Blynk Dashboard** shows:
   - V0 = large integer (e.g., 1434)

3. **Flask Console** shows:
   - `[WEBHOOK] Received encoded value: XXX → Decoded: X.XX cm`
   - `[LIVE] Stored reading: blynk_V0 = X.XX cm`

4. **Database** contains:
   - `water_level` column with decimals (e.g., 14.34, 21.50)

5. **Frontend** displays:
   - "Water Level: 12.34 cm" (with decimals)

6. **Alerts** trigger:
   - When decoded value exceeds threshold (e.g., 21.5 > 21)

---

## 📚 Additional Resources

- **Full Documentation:** `VALUE_ENCODING_SYSTEM.md`
- **ESP32 Code:** `ESP32_ENCODING_EXAMPLE.ino`
- **Heartbeat Setup:** `HEARTBEAT_SETUP.md`
- **Webhook Setup:** `BLYNK_WEBHOOK_SETUP.md`

---

## 🎉 Ready to Go!

1. Upload ESP32 code with WiFi credentials
2. Run Flask: `cd backendd && python app.py`
3. Open browser: `http://localhost:5030`
4. Watch console logs for `[DECODE]` messages
5. Verify database has decimal values

**Your sensor data now has full precision! 🚀**

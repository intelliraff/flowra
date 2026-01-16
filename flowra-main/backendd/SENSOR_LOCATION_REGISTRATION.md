# 📍 Sensor Location Registration Feature

## ✅ What's Been Implemented

Complete sensor registration system with location tracking and map integration!

---

## 🎯 Feature Overview

### **Sensors Page - New Functionality**

The Sensors page now includes:
1. ✅ **Registration Form** - Add sensor locations with coordinates
2. ✅ **Sensor List** - View all registered sensors
3. ✅ **Validation** - Input validation for all fields
4. ✅ **Database Integration** - Store/update sensor locations
5. ✅ **Map Integration** - View sensors on map after registration
6. ✅ **Clear Visibility** - Positioned correctly below header

---

## 📋 Form Fields

### **Required Fields:**

1. **Sensor ID** *
   - Example: `blynk_V0`, `sensor_001`
   - Used as unique identifier
   - From Blynk API or custom ID

2. **Sensor Name** *
   - Example: `Downtown Sensor`, `Main Drain Monitor`
   - Human-readable name
   - For display purposes

3. **Latitude** *
   - Range: -90 to 90
   - Example: `43.6532`
   - Decimal degrees format

4. **Longitude** *
   - Range: -180 to 180
   - Example: `-79.3832`
   - Decimal degrees format

### **Optional Fields:**

5. **Area/Location**
   - Example: `Downtown Toronto`, `North Sector`
   - Defaults to "Unknown Area" if not provided

---

## 🔌 Flask API Endpoint

### **New Endpoint:** `POST /api/sensors/add-location`

**Request Body:**
```json
{
  "sensor_id": "blynk_V0",
  "sensor_name": "Downtown Sensor",
  "latitude": 43.6532,
  "longitude": -79.3832,
  "area": "Downtown Toronto"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Sensor registered successfully",
  "data": {
    "sensor_id": "blynk_V0",
    "sensor_name": "Downtown Sensor",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "area": "Downtown Toronto"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Latitude must be between -90 and 90"
}
```

---

## 💾 Database Operations

### **Table: `sensors`**

**Columns:**
- `sensor_id` (TEXT, PRIMARY KEY)
- `latitude` (REAL)
- `longitude` (REAL)
- `area` (TEXT)

### **Logic:**

1. **Check if sensor exists** (by sensor_id)
2. **If exists:** UPDATE latitude, longitude, area
3. **If new:** INSERT new sensor record

**SQL Operations:**
```sql
-- Check existence
SELECT sensor_id FROM sensors WHERE sensor_id = ?

-- Update existing
UPDATE sensors
SET latitude = ?, longitude = ?, area = ?
WHERE sensor_id = ?

-- Insert new
INSERT INTO sensors (sensor_id, latitude, longitude, area)
VALUES (?, ?, ?, ?)
```

---

## 🎨 Page Layout

### **Positioning:**
```
┌──────────────────────────────────────┐
│  Main Navigation Header              │ ← Fixed at top
├──────────────────────────────────────┤
│                                      │
│  [Sensor Management Title]           │ ← paddingTop: 100px
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Registration Form              │ │
│  │  - Sensor ID                   │ │
│  │  - Sensor Name                 │ │
│  │  - Latitude / Longitude        │ │
│  │  - Area                        │ │
│  │  [Register Button]             │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Registered Sensors List        │ │
│  │  [Sensor 1] [Sensor 2] ...     │ │
│  └────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

**No Overlap with Header!** ✅

---

## 🔄 Workflow

### **Step-by-Step Process:**

1. **User enters sensor information:**
   - Sensor ID (from Blynk or custom)
   - Sensor Name
   - Latitude & Longitude (from Google Maps)
   - Area (optional)

2. **Click "Register Sensor Location" button**

3. **Frontend validation:**
   - ✅ All required fields filled
   - ✅ Latitude range (-90 to 90)
   - ✅ Longitude range (-180 to 180)

4. **Send POST request to Flask:**
   ```javascript
   POST /api/sensors/add-location
   Body: { sensor_id, sensor_name, latitude, longitude, area }
   ```

5. **Flask processes request:**
   - Validates data
   - Checks if sensor exists
   - Updates or inserts into database
   - Returns success/error

6. **Frontend shows result:**
   - ✅ Success: Green message + form clears + sensor list refreshes
   - ❌ Error: Red message with error details

7. **View on map:**
   - Click "View on Map" on any sensor card
   - Navigates to Map page
   - Shows sensor marker with latest water level

---

## 🧪 Testing

### **Step 1: Access Sensors Page**
```
http://localhost:5030/hehehe#sensors
```

### **Step 2: Fill Form with Test Data**

**Example - Toronto Location:**
```
Sensor ID: sensor_001
Sensor Name: Toronto Downtown Drain
Latitude: 43.6532
Longitude: -79.3832
Area: Downtown Toronto
```

### **Step 3: Click "Register Sensor Location"**

Expected Result:
- ✅ Green success message appears
- ✅ Form clears automatically
- ✅ Sensor appears in list below
- ✅ Can click "View on Map"

### **Step 4: Verify in Database**

```bash
cd backendd
python -c "
import sqlite3
conn = sqlite3.connect('water_alert.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM sensors')
for row in cursor.fetchall():
    print(row)
conn.close()
"
```

### **Step 5: View on Map**

1. Click "View on Map" link on sensor card
2. Map page opens
3. ✅ Sensor marker appears at registered coordinates
4. ✅ Marker color based on water level (if readings exist)

---

## 🗺️ Map Integration

### **Automatic Integration:**

Once a sensor is registered:

1. **Appears in `/api/drainage-locations` endpoint**
   - Combines sensor metadata with latest reading
   - Returns coordinates for map display

2. **Shows on Map page automatically**
   - Marker placed at exact coordinates
   - Color-coded by water level
   - Popup shows sensor details

3. **Live updates**
   - Map refreshes every 30 seconds
   - New sensors appear automatically
   - Water level updates reflect in marker color

---

## ✅ Validation Rules

### **Sensor ID:**
- ✅ Required (non-empty)
- ✅ Can be alphanumeric with underscores
- ✅ Example: `blynk_V0`, `sensor_001`

### **Sensor Name:**
- ✅ Required (non-empty)
- ✅ Any text
- ✅ Example: `Downtown Sensor`

### **Latitude:**
- ✅ Required
- ✅ Must be a number
- ✅ Range: -90 to 90
- ✅ Decimal format: `43.6532`

### **Longitude:**
- ✅ Required
- ✅ Must be a number
- ✅ Range: -180 to 180
- ✅ Decimal format: `-79.3832`

### **Area:**
- ⭕ Optional
- ✅ Defaults to "Unknown Area"
- ✅ Example: `Downtown Toronto`

---

## 💡 How to Get Coordinates

### **Method 1: Google Maps**
1. Open [Google Maps](https://maps.google.com)
2. Right-click on location
3. Click "What's here?"
4. Coordinates appear at bottom
5. Copy and paste into form

### **Method 2: Current Location (Browser)**
```javascript
navigator.geolocation.getCurrentPosition((position) => {
  console.log('Lat:', position.coords.latitude);
  console.log('Lng:', position.coords.longitude);
});
```

### **Method 3: Address Geocoding**
Use a geocoding service to convert address to coordinates.

---

## 🎨 UI Features

### **Registration Form:**
- ✅ **Clear labels** with icons
- ✅ **Placeholder text** with examples
- ✅ **Input validation** with range hints
- ✅ **Large buttons** easy to click
- ✅ **Loading state** (spinner during submission)
- ✅ **Success/error messages** (color-coded)
- ✅ **Auto-clear** form after success

### **Sensor Cards:**
- ✅ **Sensor ID** as title
- ✅ **Area** as subtitle
- ✅ **Coordinates** displayed
- ✅ **"View on Map"** link
- ✅ **Hover effects** for interactivity
- ✅ **Grid layout** (responsive: 1/2/3 columns)

### **Empty State:**
- ✅ Icon and message when no sensors
- ✅ Encourages user to add first sensor

---

## 🔗 Integration with Blynk

### **Get Sensor ID from Blynk Dashboard:**

In your Blynk dashboard, sensors are typically identified by:
- **Virtual Pins**: `V0`, `V1`, `V2`, etc.
- **Device ID**: Unique Blynk device identifier

**Suggested naming:**
```
Sensor ID: blynk_V0
Sensor Name: Main Drain Sensor
```

This matches the naming used in webhook and dashboard APIs.

---

## 📊 Example Usage Scenarios

### **Scenario 1: Register Blynk Sensor**
```
Sensor ID: blynk_V0
Sensor Name: Main Drain Monitor
Latitude: 43.6532
Longitude: -79.3832
Area: Downtown Toronto
```

### **Scenario 2: Register Multiple Sensors**
```
Sensor 1:
  ID: sensor_north
  Name: North Sector Drain
  Lat: 43.7000
  Lng: -79.4163
  Area: North York

Sensor 2:
  ID: sensor_east
  Name: East Sector Drain
  Lat: 43.7500
  Lng: -79.3700
  Area: Scarborough
```

### **Scenario 3: Update Existing Sensor**
```
If sensor_001 already exists:
- Submit form with same Sensor ID
- New coordinates will UPDATE the existing record
- Message: "Sensor updated successfully"
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Form submits without errors
✅ Success message appears (green)
✅ Form clears automatically
✅ Sensor appears in list below
✅ Sensor count updates
✅ Database contains sensor record
✅ Sensor appears on Map page
✅ Marker shows at correct coordinates

---

## 🐛 Troubleshooting

### **Form not submitting:**
- Check all required fields are filled
- Verify latitude/longitude are valid numbers
- Check browser console for errors

### **"Failed to connect to server":**
- Verify Flask server is running
- Check Flask logs for errors
- Test endpoint with curl

### **Sensor not appearing on map:**
- Wait 30 seconds for auto-refresh
- Or manually refresh Map page
- Verify sensor has valid coordinates

### **Duplicate sensor:**
- Same sensor_id will UPDATE existing record
- Not create a duplicate

---

## 🚀 Quick Start

1. **Open Sensors page:**
   ```
   http://localhost:5030/hehehe#sensors
   ```

2. **Fill form:**
   - Sensor ID: `test_sensor_001`
   - Sensor Name: `Test Sensor`
   - Latitude: `43.6532`
   - Longitude: `-79.3832`
   - Area: `Test Area`

3. **Click "Register Sensor Location"**

4. **See success message** ✅

5. **Click "View on Map"** on sensor card

6. **See marker on map** ✅

---

## 📁 Files Modified

1. ✅ `backendd/templates/src/pages/Sensors.js` - Complete registration form
2. ✅ `backendd/app.py` - Added `/api/sensors/add-location` endpoint
3. ✅ Built successfully - Ready to use!

---

## 🎊 Feature Complete!

Your Flowra system now has:
- ✅ Sensor location registration
- ✅ Form validation
- ✅ Database storage
- ✅ Automatic map integration
- ✅ Update existing sensors
- ✅ Beautiful UI
- ✅ Real-time updates

**Register your sensors and see them on the map instantly!** 📍✨

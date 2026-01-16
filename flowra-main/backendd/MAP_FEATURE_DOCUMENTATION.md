# 🗺️ Interactive Map Feature Documentation

## ✅ What's Been Implemented

Your Flowra system now has a fully functional interactive map with real-time drainage monitoring!

---

## 🎨 Header Visibility Improvements

### **Changes Made:**
1. **Stronger background color**: Changed from `rgba(255, 255, 255, 0.05)` to `rgba(3, 4, 94, 0.85)` (dark blue with 85% opacity)
2. **Enhanced border**: Added colored border with `rgba(0, 180, 216, 0.3)` (cyan accent)
3. **Better shadow**: Added dual shadow for more depth and visibility
4. **Reduced background animations**:
   - Opacity reduced from 0.1 to 0.05 for `.blur-background`
   - Glow arcs reduced from 0.15 to 0.08 opacity
   - Added 0.6 opacity to `.glow-arc` elements
   - Slower animation (8s instead of 6s)

### **Result:**
The header now stands out clearly against any page content, making navigation easy to see and identify.

---

## 🗺️ MapLibre GL Integration

### **1. Installed Packages**
```bash
npm install maplibre-gl
```

**Package installed:** `maplibre-gl@4.7.1` (with 28 dependencies)

---

## 🧩 Components Created

### **1. DrainageMap Component** (`src/components/DrainageMap.js`)

**Features:**
- Displays interactive map using MapLibre GL JS
- Free map tiles from CartoDB Voyager
- Automatically centers on drainage locations
- Colored markers based on water level
- Custom popups with detailed information
- Legend showing water level status ranges
- Pulse animation for critical water levels (≥70cm)
- Navigation controls (zoom in/out)
- Scale control (distance measurement)
- Responsive design

**Marker Colors:**
| Water Level | Color | Status |
|------------|-------|--------|
| 0-30 cm | Green | Normal |
| 30-50 cm | Blue | Moderate |
| 50-70 cm | Yellow | Warning |
| 70-80 cm | Orange | High Alert |
| 80+ cm | Red | Critical |

**Props:**
```javascript
<DrainageMap drainageLocations={[
  {
    sensor_id: "sensor_001",
    latitude: 43.6532,
    longitude: -79.3832,
    area: "Downtown",
    water_level: 75.5,
    timestamp: "2026-01-09T15:30:00",
    name: "Downtown Drain"
  }
]} />
```

### **2. Map Page Component** (`src/pages/Map.js`)

**Features:**
- Fetches drainage locations from Flask API
- Auto-refreshes every 30 seconds
- Displays summary statistics (total locations, high alerts, normal)
- Manual refresh button
- Loading states with spinner
- Error handling and display
- Full-width interactive map
- Location list grid below map
- Real-time status indicators

---

## 🔌 Flask API Endpoint

### **New Endpoint:** `GET /api/drainage-locations`

**Location:** `backendd/app.py`

**Purpose:** Returns all drainage sensor locations with their latest water level readings

**Response Format:**
```json
{
  "success": true,
  "locations": [
    {
      "sensor_id": "sensor_001",
      "latitude": 43.6532,
      "longitude": -79.3832,
      "area": "Downtown",
      "water_level": 75.5,
      "timestamp": "2026-01-09 15:30:00",
      "name": "Downtown Drain"
    },
    {
      "sensor_id": "sensor_002",
      "latitude": 43.7000,
      "longitude": -79.4000,
      "area": "North York",
      "water_level": 45.2,
      "timestamp": "2026-01-09 15:29:55",
      "name": "North York Drain"
    }
  ],
  "count": 2
}
```

**Logic:**
1. Queries all sensors from `sensors` table
2. For each sensor, gets latest reading from `readings` table
3. Combines sensor metadata with latest water level
4. Returns formatted array of locations

**Test Endpoint:**
```bash
curl http://localhost:5030/api/drainage-locations
```

---

## 🎯 Data Flow

```
Database (sensors + readings tables)
    ↓
Flask /api/drainage-locations endpoint
    ↓
React Map page (fetches every 30s)
    ↓
DrainageMap component (receives locations as props)
    ↓
MapLibre GL (renders markers on map)
    ↓
User clicks marker → Popup shows details
```

---

## 🎨 Map Features

### **Interactive Elements:**

1. **Markers**
   - Color-coded by water level
   - Pulse animation for critical levels
   - Click to view popup with details
   - White border for visibility

2. **Popups**
   - Sensor ID/name
   - Current water level (with color)
   - Status (Normal, Warning, etc.)
   - Area/location
   - Last update timestamp

3. **Controls**
   - Zoom in/out buttons (top-right)
   - Scale indicator (bottom-left)
   - Legend (bottom-right)

4. **Auto-Fit**
   - Single location: Zooms to level 15
   - Multiple locations: Fits all markers in view
   - Default: Toronto coordinates if no data

---

## 📊 Map Page Statistics Bar

Displays real-time counts:
- **Total Locations**: Number of drainage sensors
- **High Alert**: Sensors with water level ≥ 70 cm
- **Normal**: Sensors with water level < 50 cm
- **Refresh Button**: Manual data reload

---

## 🧪 Testing the Map

### **Step 1: Ensure Sensors Exist in Database**

Check if you have sensors with coordinates:
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

### **Step 2: Add Sample Sensor Data (if needed)**

```python
import sqlite3
conn = sqlite3.connect('water_alert.db')

# Add sample sensors with Toronto area coordinates
conn.execute("""
    INSERT INTO sensors (sensor_id, latitude, longitude, area)
    VALUES ('sensor_001', 43.6532, -79.3832, 'Downtown Toronto')
""")
conn.execute("""
    INSERT INTO sensors (sensor_id, latitude, longitude, area)
    VALUES ('sensor_002', 43.7000, -79.4163, 'North York')
""")
conn.execute("""
    INSERT INTO sensors (sensor_id, latitude, longitude, area)
    VALUES ('sensor_003', 43.7500, -79.3700, 'Scarborough')
""")

# Add sample readings
conn.execute("""
    INSERT INTO readings (sensor_id, water_level)
    VALUES ('sensor_001', 75.5)
""")
conn.execute("""
    INSERT INTO readings (sensor_id, water_level)
    VALUES ('sensor_002', 45.2)
""")
conn.execute("""
    INSERT INTO readings (sensor_id, water_level)
    VALUES ('sensor_003', 85.0)
""")

conn.commit()
conn.close()
print("Sample data added!")
```

### **Step 3: Test API Endpoint**

```bash
curl http://localhost:5030/api/drainage-locations
```

Expected: JSON with sensor locations and water levels

### **Step 4: View Map**

1. Open: `http://localhost:5030/hehehe#map`
2. Should see:
   - Interactive map with markers
   - Colored markers based on water level
   - Statistics bar at top
   - Location list at bottom
   - Click markers to see popups

---

## 🎨 CSS Additions

Added pulse animation for critical markers:
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}
```

---

## 📁 Files Modified/Created

### **Created:**
1. `backendd/templates/src/components/DrainageMap.js` - Reusable map component
2. `backendd/MAP_FEATURE_DOCUMENTATION.md` - This file

### **Modified:**
1. `backendd/templates/src/index.css` - Header visibility + pulse animation
2. `backendd/templates/src/pages/Map.js` - Complete map page with data fetching
3. `backendd/app.py` - Added `/api/drainage-locations` endpoint
4. `backendd/templates/package.json` - Added maplibre-gl dependency

---

## 🚀 Usage Examples

### **Access the Map:**
```
http://localhost:5030/hehehe#map
```

### **Fetch Drainage Data in Code:**
```javascript
const response = await fetch('/api/drainage-locations');
const data = await response.json();

if (data.success) {
  console.log(`Found ${data.count} drainage locations`);
  data.locations.forEach(loc => {
    console.log(`${loc.name}: ${loc.water_level}cm`);
  });
}
```

### **Use DrainageMap Component:**
```javascript
import DrainageMap from '../components/DrainageMap';

function MyComponent() {
  const [locations, setLocations] = useState([]);

  return <DrainageMap drainageLocations={locations} />;
}
```

---

## 🎯 Key Features Summary

✅ **Real-time Monitoring**: Map updates every 30 seconds automatically
✅ **Color-Coded Status**: Instantly see which drains need attention
✅ **Interactive Markers**: Click for detailed information
✅ **Responsive Design**: Works on desktop and mobile
✅ **Auto-Centering**: Map adjusts to show all drainage points
✅ **Legend**: Clear explanation of color meanings
✅ **Statistics**: Quick overview of system status
✅ **Error Handling**: Graceful fallback if data unavailable
✅ **Performance**: Efficient queries and rendering

---

## 🐛 Troubleshooting

### **Map Not Showing:**
- Check browser console for errors
- Verify MapLibre CSS is loaded
- Ensure coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

### **No Markers Visible:**
- Verify `/api/drainage-locations` returns data
- Check that sensors have latitude/longitude values
- Inspect browser network tab for API errors

### **Markers Wrong Color:**
- Check water_level values in database
- Verify threshold logic in `getMarkerColor()` function

### **Map Tiles Not Loading:**
- Check internet connection (map tiles from CartoDB CDN)
- Try different tile provider if needed
- Check browser console for tile loading errors

---

## 🎉 Success!

Your Flowra system now has:
- ✅ Clearly visible header
- ✅ MapLibre GL integration
- ✅ Interactive drainage monitoring map
- ✅ Real-time data visualization
- ✅ Color-coded status indicators
- ✅ Automatic data refresh
- ✅ Flask API for drainage locations

**Visit `http://localhost:5030/hehehe#map` to see it in action!** 🗺️✨

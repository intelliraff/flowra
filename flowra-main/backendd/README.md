# Flowra Water Monitoring System - Backend

A Flask-based water monitoring system with Blynk API integration for real-time sensor data.

## Setup

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and set your Blynk authentication token:

```env
BLYNK_AUTH_TOKEN=your_actual_blynk_auth_token_here
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5030/hehehe`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BLYNK_AUTH_TOKEN` | Your Blynk authentication token | Required |
| `BLYNK_BASE_URL` | Blynk API base URL | `https://blynk.cloud/external/api/get` |
| `FLASK_ENV` | Flask environment | `development` |
| `FLASK_DEBUG` | Enable debug mode | `True` |
| `FLASK_HOST` | Server host | `0.0.0.0` |
| `FLASK_PORT` | Server port | `5030` |
| `WATER_LEVEL_THRESHOLD` | Alert threshold for water levels | `70` |

## API Endpoints

### POST /api/webhook/blynk

**Blynk Webhook Endpoint** - Receives automatic updates from Blynk when datastreams change.

**Blynk Webhook URL:** `http://your-server:5030/api/webhook/blynk`

**Blynk Setup:**
1. In Blynk app/web dashboard, go to device settings
2. Add webhook in "Webhooks" section
3. Set URL to: `http://your-server:5030/api/webhook/blynk`
4. Choose HTTP method: POST
5. Set datastream trigger (e.g., when V0 changes)

**Webhook Data Format:**
```json
{
  "deviceName": "ESP32_Device",
  "deviceId": "device_123",
  "datastreamId": "V0",
  "value": "45.67",
  "timestamp": 1640995200
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook data stored successfully",
  "data": {
    "device_id": "device_123",
    "sensor_value": 45.67,
    "datastream_id": "V0"
  }
}
```

### GET /api/latest

Get the most recent water level reading from database.

**Example:**
```bash
curl "http://localhost:5030/api/latest"
```

**Response:**
```json
{
  "success": true,
  "latest_reading": {
    "id": 123,
    "sensor_id": "blynk_V0",
    "water_level": 45.67,
    "timestamp": "2026-01-09T12:34:56"
  }
}
```

### GET /api/fetch-blynk

Fetch sensor data from Blynk API manually.

**Parameters:**
- `token` (optional): Override the default Blynk token
- `pin` (optional): Virtual pin to read from (default: V0)

**Example:**
```bash
curl "http://localhost:5030/api/fetch-blynk?pin=V0"
```

**Response:**
```json
{
  "success": true,
  "sensor_value": 45.67,
  "pin": "V0",
  "timestamp": "2026-01-09T12:34:56.789012"
}
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your Blynk authentication token secure
- The `.env` file is already in `.gitignore`

## Getting Your Blynk Token

1. Open the Blynk app
2. Go to Settings > Auth Tokens
3. Copy your authentication token
4. Paste it into your `.env` file

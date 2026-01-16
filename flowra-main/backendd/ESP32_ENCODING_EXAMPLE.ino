/*
 * ESP32 Blynk Water Level Sensor - Value Encoding Example
 *
 * This code multiplies sensor values by 100 before sending to Blynk
 * to preserve two decimal places through Blynk's integer constraints.
 *
 * Example: 12.34 cm → sends 1234 to Blynk
 */

#define BLYNK_TEMPLATE_ID "TMPL3CgFlUliY"
#define BLYNK_TEMPLATE_NAME "water level monitor"
#define BLYNK_AUTH_TOKEN "nDP_aTNF76zAo1L7LjCGLGnkCHIX_qP8"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>

// WiFi credentials
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

// Ultrasonic sensor pins
#define TRIG_PIN 5
#define ECHO_PIN 18

// Blynk virtual pins
#define WATER_LEVEL_PIN V0      // Water level (encoded)
#define HEARTBEAT_PIN V9        // Heartbeat timestamp

// Sensor configuration
#define TANK_HEIGHT 24.0        // Tank height in cm
#define SCALE_FACTOR 100        // Multiply by 100 to preserve 2 decimal places

BlynkTimer timer;

void setup() {
  Serial.begin(115200);

  // Initialize ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Connect to WiFi and Blynk
  Serial.println("Connecting to WiFi and Blynk...");
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // Setup timer to send data every 5 seconds
  timer.setInterval(5000L, sendSensorData);

  Serial.println("Setup complete!");
}

void loop() {
  Blynk.run();
  timer.run();
}

// Read distance from ultrasonic sensor
float readDistance() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo pulse duration
  long duration = pulseIn(ECHO_PIN, HIGH);

  // Calculate distance in cm (speed of sound = 343 m/s)
  // Distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;

  return distance;
}

// Calculate water level from distance
float calculateWaterLevel(float distance) {
  // Water level = tank height - distance from sensor
  float waterLevel = TANK_HEIGHT - distance;

  // Ensure water level is within valid range
  if (waterLevel < 0) waterLevel = 0;
  if (waterLevel > TANK_HEIGHT) waterLevel = TANK_HEIGHT;

  return waterLevel;
}

// Send sensor data to Blynk
void sendSensorData() {
  // Read sensor and calculate water level
  float distance = readDistance();
  float realWaterLevel = calculateWaterLevel(distance);

  // ============================================
  // ENCODING STEP: Multiply by 100 to preserve 2 decimal places
  // ============================================
  int encodedValue = (int)(realWaterLevel * SCALE_FACTOR);

  // Log both values
  Serial.print("Real water level: ");
  Serial.print(realWaterLevel, 2);  // Print with 2 decimal places
  Serial.print(" cm → Sending encoded value: ");
  Serial.println(encodedValue);

  // Send encoded value to Blynk
  Blynk.virtualWrite(WATER_LEVEL_PIN, encodedValue);

  // ============================================
  // HEARTBEAT: Send current timestamp
  // ============================================
  unsigned long currentTimestamp = millis() / 1000;  // Convert to seconds
  Blynk.virtualWrite(HEARTBEAT_PIN, currentTimestamp);

  Serial.print("Heartbeat timestamp sent: ");
  Serial.println(currentTimestamp);
  Serial.println("---");
}

/*
 * EXAMPLE OUTPUT:
 *
 * Real water level: 12.34 cm → Sending encoded value: 1234
 * Heartbeat timestamp sent: 12543
 * ---
 * Real water level: 15.67 cm → Sending encoded value: 1567
 * Heartbeat timestamp sent: 12548
 * ---
 * Real water level: 21.00 cm → Sending encoded value: 2100
 * Heartbeat timestamp sent: 12553
 * ---
 */

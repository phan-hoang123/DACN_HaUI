#include <DHT.h>
#include <DHT_U.h>

#include <WiFi.h>
#include <HTTPClient.h>

// 1. ĐIỀN THÔNG TIN WIFI VÀ ĐỊA CHỈ MÁY TÍNH CỦA BÁC VÀO ĐÂY
const char* ssid = "P705"; 
const char* password = "15071997";
// (Lưu ý: Bác mở CMD gõ ipconfig để xem IPv4 của máy tính, ví dụ 192.168.1.5)
const char* serverUrl = "https://vernex-production.up.railway.app/api/iot/push";

#define CHAN_RELAY_QUAT 2  // Khai báo nối mạch Relay điều khiển quạt vào chân số 2 (D2)
#define DHTPIN 4       // Chân nối DHT22
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define MQ135_PIN 36   // Chân nối MQ-135

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(CHAN_RELAY_QUAT, OUTPUT); // Khai báo chân Relay là cổng xuất điện
  
  // Kết nối Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Đang bắt Wi-Fi...");
  }
  Serial.println("Đã kết nối Wi-Fi thành công!");
}

void loop() {
  // Đọc cảm biến thật
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int mq135_val = analogRead(MQ135_PIN);
  float nh3 = map(mq135_val, 0, 4095, 0, 100); // Quy đổi điện áp ra nồng độ ppm

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Đóng gói dữ liệu thành chuẩn JSON
    String jsonPayload = "{\"temperature\":" + String(t) + ", \"humidity\":" + String(h) + ", \"nh3\":" + String(nh3) + "}";
    
    // Bắn dữ liệu lên thẳng Node.js
    int httpResponseCode = http.POST(jsonPayload); 

if (httpResponseCode > 0) {
    // 1. Hứng câu trả lời từ Server Node.js
    String response = http.getString(); 
    Serial.println("Server trả lời: " + response); 
    
    // 2. Đọc hiểu mệnh lệnh (Tìm xem có chữ "quat":"ON" trong câu trả lời không)
    if (response.indexOf("\"quat\":\"ON\"") > 0) {
        digitalWrite(CHAN_RELAY_QUAT, HIGH); // Bật công tắc điện, quạt quay vù vù!
        Serial.println("Đã bật quạt làm mát!");
    } else {
        digitalWrite(CHAN_RELAY_QUAT, LOW);  // Tắt quạt
    }
}
  }
  
  delay(3000); // Chờ 3 giây rồi đo tiếp
}
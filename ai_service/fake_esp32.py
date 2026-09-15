import requests
import time
import random
import urllib3

# Tắt cảnh báo SSL do chạy localhost HTTPS
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_BARN_URL = "https://localhost:7141/api/barn"
API_SENSOR_URL = "https://localhost:7141/api/iot/data"
NODE_URL = "http://localhost:3000/api/broadcast"

print("🚀 Khởi động mạch ESP32 (Chế độ tự động khám phá ID)...")

while True:
    try:
        # ========================================================
        # LUỒNG 1: BƠM DỮ LIỆU THỜI GIAN THỰC SANG NODE.JS (CHO BIỂU ĐỒ & AI)
        # ========================================================
        # Dùng random để tạo sóng biến thiên cho biểu đồ và AI trông thật hơn
        nhiet_do_chung = round(random.uniform(28.0, 36.0), 1)
        do_am_chung = round(random.uniform(60.0, 85.0), 1)
        ai_du_bao = round(nhiet_do_chung + random.uniform(1.0, 3.5), 1)
        
        node_payload = {
            "nhiet_do": nhiet_do_chung,
            "do_am": do_am_chung,
            "tong_dan": random.randint(12440, 12450), # Số vật nuôi nhảy nhẹ
            "predicted_temp": ai_du_bao,
            "message": "AI: Cảnh báo nhiệt độ tăng cao!" if ai_du_bao >= 36 else "AI: Thời tiết ổn định, duy trì chế độ ECO."
        }
        
        try:
            requests.post(NODE_URL, json=node_payload, timeout=2)
            print(f"📡 [NODE.JS] Đã phát luồng Real-time (Temp: {nhiet_do_chung}°C, Humid: {do_am_chung}%)")
        except Exception as e:
            print("❌ Lỗi kết nối Node.js (Nhớ bật cổng 3000 nhé):", e)

        # ========================================================
        # LUỒNG 2: BƠM DỮ LIỆU ĐỊNH KỲ SANG C# (LƯU DATABASE)
        # ========================================================
        response = requests.get(API_BARN_URL, verify=False)
        
        if response.status_code == 200:
            danh_sach_chuong = response.json()
            
            if len(danh_sach_chuong) == 0:
                print("⚠️ CSDL trống. Không có chuồng nào để gửi data. Đang chờ...")
            else:
                for chuong in danh_sach_chuong:
                    barn_id = chuong['id']
                    payload = {
                        "BarnId": barn_id,
                        "Temperature": round(random.uniform(25.0, 35.0), 1),
                        "Humidity": round(random.uniform(50.0, 80.0), 1),
                        "Nh3Level": round(random.uniform(5.0, 20.0), 1)
                    }
                    res = requests.post(API_SENSOR_URL, json=payload, verify=False)
                    print(f"✅ [C# API] Đã lưu Cảm biến -> Chuồng ID {barn_id} (Status: {res.status_code})")
                    
    except Exception as e:
        print(f"❌ Lỗi vòng lặp chính: {e}")
        
    print("-" * 50)
    # Nghỉ 3 giây rồi chạy lại chu trình
    time.sleep(3)
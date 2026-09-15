from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import xgboost as xgb

app = FastAPI()

# 1. NẠP "BỘ NÃO" AI VÀO BỘ NHỚ NGAY KHI SERVER KHỞI ĐỘNG
ai_model = xgb.XGBRegressor()
ai_model.load_model("data_model.json") # Đọc file model ông vừa train

class WeatherData(BaseModel):
    nhiet_do: float
    do_am: float
    gio: int

@app.post("/api/predict-weather")
def predict_weather(data: WeatherData):
    # 2. Đóng gói dữ liệu C# gửi sang thành bảng (DataFrame) để AI đọc được
    input_df = pd.DataFrame([[data.nhiet_do, data.do_am, data.gio]], 
                            columns=['nhiet_do_hien_tai', 'do_am_hien_tai', 'gio_trong_ngay'])
    
    # 3. AI TÍNH TOÁN DỰ BÁO (Không dùng số ảo nữa)
    predicted_temp = float(ai_model.predict(input_df)[0])
    
    # 4. Hệ chuyên gia ra quyết định dựa trên số AI vừa dự báo
    if predicted_temp >= 38.0:
        return {
            "predicted_temp": round(predicted_temp, 1),
            "cap_do": "Cấp độ 2",
            "message": "Dự báo thời tiết nóng. AI đang đưa hệ thống về trạng thái chuẩn bị làm mát Cấp độ 2 để vật nuôi không bị stress nhiệt độ, đồng thời vẫn tối ưu được chi phí điện năng tiêu thụ.",
            "rem_che": "RÈM CHE TỰ ĐỘNG (50%)",
            "quat": "QUẠT THÔNG GIÓ (Mức 2)"
        }
    elif predicted_temp >= 35.0:
        return {
            "predicted_temp": round(predicted_temp, 1),
            "cap_do": "Cấp độ 1",
            "message": "Dự báo thời tiết ấm. Hệ thống duy trì thông gió nhẹ nhàng.",
            "rem_che": "RÈM CHE TỰ ĐỘNG (30%)",
            "quat": "QUẠT THÔNG GIÓ (Mức 1)"
        }
    else:
        return {
            "predicted_temp": round(predicted_temp, 1),
            "cap_do": "An toàn",
            "message": "Thời tiết lý tưởng. Giữ nguyên trạng thái hiện tại.",
            "rem_che": "MỞ RÈM (0%)",
            "quat": "TẮT QUẠT"
        }
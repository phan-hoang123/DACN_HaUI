import base64
import cv2
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="YOLOv8 Edge Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Đang nạp Model YOLOv8 lên Card đồ họa...")
model = YOLO('best.pt') 

class ImagePayload(BaseModel):
    image_base64: str

@app.post("/api/ai/detect")
async def detect_objects(payload: ImagePayload):
    try:
        # 1. Tránh lỗi Web gửi ảnh rỗng lúc Video chưa load xong
        if not payload.image_base64 or "," not in payload.image_base64:
            return {"status": "success", "data": []}
            
        base64_data = payload.image_base64.split(',')[1]
        if not base64_data:
            return {"status": "success", "data": []}

        # 2. Giải mã ảnh
        img_data = base64.b64decode(base64_data)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # 3. Tránh trường hợp OpenCV giải mã lỗi
        if img is None:
            return {"status": "success", "data": []}

        # 4. Đưa vào Model best.pt phân tích
        results = model.track(img, persist=True, verbose=False)
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                
                label = model.names[class_id]
                
                track_id = int(box.id[0]) if box.id is not None else 0
                
                detections.append({
                    "track_id": track_id,
                    "label": label,
                    "confidence": confidence,
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                })
                    
        return {"status": "success", "data": detections}
    
    except Exception as e:
        print("Bỏ qua frame lỗi:", e)
        return {"status": "success", "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
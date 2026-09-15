import pandas as pd
import xgboost as xgb
import numpy as np

print("1. Đang đọc dữ liệu thật từ file MySQL...")
df = pd.read_csv("du_lieu_3_thang_mysql.csv")

print("2. Đang tiền xử lý dữ liệu (Data Preprocessing)...")
df_clean = pd.DataFrame()
df_clean['nhiet_do_hien_tai'] = df['Temperature']
df_clean['do_am_hien_tai'] = df['Humidity']

df['RecordedAt'] = pd.to_datetime(df['RecordedAt'])
df_clean['gio_trong_ngay'] = df['RecordedAt'].dt.hour

dieu_kien_trua = (df_clean['gio_trong_ngay'] >= 10) & (df_clean['gio_trong_ngay'] <= 14)
df_clean['nhiet_do_2h_sau'] = df_clean['nhiet_do_hien_tai'] + np.where(dieu_kien_trua, 2.5, -1.0)
df_clean['nhiet_do_2h_sau'] += np.random.normal(0, 0.5, len(df_clean))

df_clean = df_clean.dropna()

print("3. AI đang tiến hành học quy luật (Training)...")
X = df_clean[['nhiet_do_hien_tai', 'do_am_hien_tai', 'gio_trong_ngay']]
y = df_clean['nhiet_do_2h_sau']

# SỬA LỖI Ở ĐÂY: Dùng cấu hình mặc định hoàn toàn để tránh xung đột phiên bản
model = xgb.XGBRegressor()
model.fit(X, y)

print("4. Đang xuất bộ não ra file JSON...")
model.save_model("data_model.json")
print("-> XONG! Đã train thành công bằng dữ liệu MySQL và lưu thành data_model.json")
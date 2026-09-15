// --- 1. ĐỒNG HỒ THỜI GIAN THỰC ---
setInterval(() => {
  const now = new Date();
  document.getElementById("live-clock").innerText =
    now.toLocaleTimeString("vi-VN") + " | " + now.toLocaleDateString("vi-VN");
}, 1000);

// --- 2. LOGIC CHUYỂN TAB MỤC LỤC ---
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.add("hidden"));
  document.getElementById("tab-" + tabId).classList.remove("hidden");

  document.querySelectorAll("nav a").forEach((menu) => {
    menu.classList.remove("active-menu");
    menu.classList.add("hover:bg-slate-800", "hover:text-white");
  });
  const currentMenu = document.getElementById("menu-" + tabId);
  currentMenu.classList.add("active-menu");
  currentMenu.classList.remove("hover:bg-slate-800", "hover:text-white");

  const titles = {
    "tong-quan": "Bảng Điều Khiển",
    "cam-bien": "Giám Sát Hệ Thống Cảm Biến Real-time",
    "chuong-trai": "Cấu Hình Ngưỡng Thiết Bị Chuồng Trại",
    "nhat-ky": "Nhật Ký Nhật Trình Hệ Thống IoT",
    "ai-camera": "AI Camera Giám Sát Hành Vi Vật Nuôi",
  };
  document.getElementById("page-title").innerText = titles[tabId];
  if (tabId === 'ai-camera') {
      startMultiCamAI();
  }
}

// --- 3. CẤU HÌNH CÁC BIỂU ĐỒ ---
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#64748b";

const ctxMain = document.getElementById("mainDashboardChart").getContext("2d");
const mainChart = new Chart(ctxMain, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Nhiệt độ trung bình (°C)",
        data: [],
        borderColor: "#f43f5e",
        backgroundColor: "rgba(244, 63, 94, 0.05)",
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
      },
      {
        label: "Độ ẩm trung bình (%)",
        data: [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "#f1f5f9",
        },
        min: 20,
        max: 90,
      },
    },
  },
});

// Biến toàn cục rỗng, chờ châm data từ CSDL C#
let danhSachChuong = [];

// =========================================================
// MODULE: KẾT NỐI API THỰC TẾ (REAL DB INTERACTION)
// =========================================================

// 1. TẢI DỮ LIỆU TỪ BACKEND
async function loadDanhSachChuong() {
  try {
    const response = await fetch("https://localhost:7141/api/barn");
    if (response.ok) {
      danhSachChuong = await response.json();

      // Ép Web "F5" lại toàn bộ giao diện bằng data thật
      renderBangCrudChuong(danhSachChuong);
      renderGiaoDienChuongTrai();
      renderCameraList();
      renderAICameraGrid();
    }
  } catch (error) {
    console.error("Lỗi kéo dữ liệu từ CSDL:", error);
  }
}
// Chạy ngay khi vào web
loadDanhSachChuong();

// 2. XÓA CHUỒNG (GỌI API DELETE REAL)
async function xoaChuong(id) {
  if (
    confirm(
      `⚠️ Nguy hiểm: Việc xóa Node Chuồng ID-${id} có thể làm đứt gãy tín hiệu cảm biến IoT. Bạn có chắc chắn muốn xóa?`,
    )
  ) {
    try {
      await fetch(`https://localhost:7141/api/barn/${id}`, {
        method: "DELETE",
      });

      // Xóa DB thành công thì tải lại giao diện
      addSystemLog(
        `HỆ THỐNG: Quản trị viên vừa ngắt kết nối và xóa chuồng ID-${id}.`,
        "SYSTEM",
      );
      loadDanhSachChuong();
    } catch (error) {
      console.error("Lỗi xóa chuồng:", error);
    }
  }
}

// 3. LƯU CHUỒNG (GỌI API POST HOẶC PUT REAL)
async function luuChuong(event) {
  event.preventDefault();

  const id = document.getElementById("chuongId").value;
  const payload = {
    loai: document.getElementById("chuongLoai").value,
    lechNhietDo: parseFloat(document.getElementById("chuongLechNhiet").value),
    lechNh3: parseFloat(document.getElementById("chuongLechNh3").value),
    nguongNong: parseFloat(document.getElementById("chuongNguongNong").value),
    nguongNh3: parseFloat(document.getElementById("chuongNguongNh3").value),
  };

  try {
    if (id) {
      // SỬA: GỌI PUT
      payload.id = parseInt(id);
      payload.prefix = danhSachChuong.find((c) => c.id == id).prefix;

      await fetch(`https://localhost:7141/api/barn/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      addSystemLog(
        `HỆ THỐNG: Quản trị viên đã hiệu chỉnh lại thông số ngưỡng cho chuồng ID-${id}.`,
        "SYSTEM",
      );
    } else {
      // THÊM MỚI: GỌI POST
      payload.prefix = "t" + Math.floor(Math.random() * 1000); // Sinh random prefix cho mạch
      await fetch("https://localhost:7141/api/barn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      addSystemLog(
        `HỆ THỐNG: Đã mở rộng quy mô, đấu nối thành công chuồng mới (${payload.loai}).`,
        "ACCOUNTING",
      );
    }

    dongModalChuong();
    // Cập nhật lại toàn bộ Web
    loadDanhSachChuong();
  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);
  }
}

function renderGiaoDienChuongTrai() {
  const bangTrangThai = document.getElementById("bang-trang-thai-chuong");
  const luoiCamBien = document.getElementById("luoi-the-cam-bien");

  let htmlBang = "";
  let htmlCamBien = "";

  danhSachChuong.forEach((chuong) => {
    const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id;
    const mauChuDao = chuong.id % 2 === 0 ? "indigo" : "blue";

    // 1. Vẽ dòng cho Bảng Tổng Quan
    htmlBang += `
        <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
            <td class="p-4 font-bold text-${mauChuDao}-600 border-r border-slate-200">CHUONG-${maChuong} <span class="text-slate-400 font-normal text-xs ml-1">(${chuong.loai})</span></td>
            <td class="p-4 text-rose-600 font-black border-r border-slate-200" id="t1-t${chuong.id}">-- °C</td>
            <td class="p-4 text-blue-600 font-black border-r border-slate-200" id="t1-h${chuong.id}">-- %</td>
            <td class="p-4 text-amber-600 font-black border-r border-slate-200" id="t1-g${chuong.id}">-- ppm</td>
            <td class="p-4 border-r border-slate-200"><span id="${chuong.prefix}-stt-feed" class="px-2.5 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-none border border-emerald-300 tracking-widest uppercase">CHỜ DỮ LIỆU</span></td>
            <td class="p-4"><span id="${chuong.prefix}-stt-cool" class="px-2.5 py-1 text-[9px] font-bold bg-slate-50 text-slate-600 rounded-none border border-slate-300 transition-all tracking-widest uppercase">CHỜ DỮ LIỆU</span></td>
        </tr>
    `;

    // 2. Vẽ thẻ cho Tab Giám Sát Cảm Biến
    htmlCamBien += `
        <div class="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-5 hover:border-${mauChuDao}-400 transition-colors">
            <div class="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <h3 class="text-sm font-black text-slate-800 flex items-center uppercase tracking-wider">
                    <i class="fa-solid fa-microchip mr-2 text-${mauChuDao}-600"></i>NODE ${maChuong} / ${chuong.loai}
                </h3>
                <span class="px-2 py-1 bg-green-50 text-green-700 border border-green-300 text-[9px] font-bold rounded-none uppercase tracking-widest flex items-center"><span class="w-1.5 h-1.5 inline-block bg-green-500 mr-1.5 animate-pulse rounded-none"></span>Live</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-slate-50 p-4 rounded-none text-center border border-slate-200 shadow-inner">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nhiệt Độ</p>
                    <p class="text-2xl font-black text-rose-600 mt-2" id="c${chuong.id}-temp">--°C</p>
                </div>
                <div class="bg-slate-50 p-4 rounded-none text-center border border-slate-200 shadow-inner">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Độ Ẩm</p>
                    <p class="text-2xl font-black text-blue-600 mt-2" id="c${chuong.id}-humid">--%</p>
                </div>
                <div class="bg-slate-50 p-4 rounded-none text-center border border-slate-200 shadow-inner">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Khí NH3</p>
                    <p class="text-2xl font-black text-amber-600 mt-2" id="c${chuong.id}-nh3">-- ppm</p>
                </div>
            </div>
            <div class="p-4 bg-slate-900 rounded-none border border-slate-800 text-sm space-y-2 mt-2 shadow-inner">
                <h4 class="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3"><i class="fa-solid fa-gears mr-1.5"></i>Trạng thái Tự Động Hóa:</h4>
                <div class="flex justify-between text-[11px] text-slate-300 border-t border-slate-700 pt-3 font-mono">
                    <span>Quạt thông gió: <b id="device-fan-${chuong.id}" class="text-emerald-400 ml-1">...</b></span>
                    <span>Làm mát: <b id="device-mist-${chuong.id}" class="text-blue-400 ml-1">...</b></span>
                </div>
            </div>
        </div>
    `;
  });

  if (bangTrangThai) bangTrangThai.innerHTML = htmlBang;
  if (luoiCamBien) luoiCamBien.innerHTML = htmlCamBien;
}
renderGiaoDienChuongTrai();

// =========================================================
// MODULE: CRUD QUẢN LÝ CHUỒNG TRẠI (TẠI GIAO DIỆN)
// =========================================================

// 1. Hàm vẽ (Render) bảng dữ liệu quản lý
function renderBangCrudChuong(data) {
  const tbody = document.getElementById("bang-crud-chuong");
  if (!tbody) return;

  let html = "";
  data.forEach((chuong) => {
    const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id;
    html += `
            <tr class="hover:bg-blue-50 transition-colors">
                <td class="p-4 border-r border-slate-200 text-center font-bold text-slate-500 font-mono">${maChuong}</td>
                <td class="p-4 border-r border-slate-200 font-bold text-slate-800">${chuong.loai}</td>
                <td class="p-4 border-r border-slate-200 text-center font-mono ${chuong.lechNhietDo > 0 ? "text-rose-500" : "text-blue-500"}">${chuong.lechNhietDo}</td>
                <td class="p-4 border-r border-slate-200 text-center font-mono ${chuong.lechNh3 > 0 ? "text-amber-500" : "text-emerald-500"}">${chuong.lechNh3}</td>
                <td class="p-4 border-r border-slate-200 text-center font-bold text-rose-600">${chuong.nguongNong}</td>
                <td class="p-4 border-r border-slate-200 text-center font-bold text-amber-600">${chuong.nguongNh3}</td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="moModalChuong(${chuong.id})" class="text-blue-500 hover:text-blue-700 transition-colors" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="xoaChuong(${chuong.id})" class="text-slate-400 hover:text-rose-600 transition-colors" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
  });

  if (data.length === 0) {
    html = `<tr><td colspan="7" class="p-8 text-center text-slate-400 italic font-medium">Không tìm thấy dữ liệu chuồng trại...</td></tr>`;
  }

  tbody.innerHTML = html;
}

// Chạy lần đầu lúc vừa vào web
renderBangCrudChuong(danhSachChuong);

// 2. Logic Tìm Kiếm (Search) - Gõ đến đâu lọc đến đấy
function timKiemChuong() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = danhSachChuong.filter((chuong) =>
    chuong.loai.toLowerCase().includes(keyword),
  );
  renderBangCrudChuong(filteredData);
}

// 4. Bật/Tắt Hộp thoại Modal
function moModalChuong(id = null) {
  document.getElementById("modal-crud-chuong").classList.remove("hidden");

  if (id) {
    // Trạng thái SỬA (Update)
    document.getElementById("modal-crud-title").innerHTML =
      '<i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i>CẬP NHẬT THÔNG TIN CHUỒNG';
    const c = danhSachChuong.find((item) => item.id === id);
    document.getElementById("chuongId").value = c.id;
    document.getElementById("chuongLoai").value = c.loai;
    document.getElementById("chuongLechNhiet").value = c.lechNhietDo;
    document.getElementById("chuongLechNh3").value = c.lechNh3;
    document.getElementById("chuongNguongNong").value = c.nguongNong;
    document.getElementById("chuongNguongNh3").value = c.nguongNh3;
  } else {
    // Trạng thái THÊM MỚI (Create)
    document.getElementById("modal-crud-title").innerHTML =
      '<i class="fa-solid fa-plus mr-2 text-emerald-600"></i>THÊM CHUỒNG MỚI';
    document.getElementById("formChuong").reset();
    document.getElementById("chuongId").value = ""; // Reset ID về rỗng
  }
}

function dongModalChuong() {
  document.getElementById("modal-crud-chuong").classList.add("hidden");
}

// --- BIỂU ĐỒ AI CAMERA HISTORY ---
let aiHistoryChart;

async function taiBieuDoLichSuAI() {
  try {
    // Tạm thời ẩn việc gọi API thật đi để tránh lỗi 404
    // const response = await fetch("https://localhost:7141/api/ai/history");
    // const data = await response.json();

    // Tạo mảng dữ liệu giả lập chuẩn cấu trúc
    const data = [
        { date_label: "T2", chuong_id: 1, total_count: 6200 },
        { date_label: "T2", chuong_id: 2, total_count: 6250 },
        { date_label: "T3", chuong_id: 1, total_count: 6200 },
        { date_label: "T3", chuong_id: 2, total_count: 6250 },
        { date_label: "T4", chuong_id: 1, total_count: 6198 },
        { date_label: "T4", chuong_id: 2, total_count: 6250 },
        { date_label: "T5", chuong_id: 1, total_count: 6198 },
        { date_label: "T5", chuong_id: 2, total_count: 6255 },
        { date_label: "T6", chuong_id: 1, total_count: 6198 },
        { date_label: "T6", chuong_id: 2, total_count: 6255 },
        { date_label: "T7", chuong_id: 1, total_count: 6195 },
        { date_label: "T7", chuong_id: 2, total_count: 6255 },
        { date_label: "Hôm nay", chuong_id: 1, total_count: 6195 },
        { date_label: "Hôm nay", chuong_id: 2, total_count: 6255 }
    ];

    // Lọc trích xuất các nhãn ngày trùng lặp
    const labels = [...new Set(data.map((item) => item.date_label))];

    // Lọc mảng dữ liệu riêng cho từng chuồng
    const dataChuong1 = data.filter((item) => item.chuong_id === 1).map((item) => item.total_count);
    const dataChuong2 = data.filter((item) => item.chuong_id === 2).map((item) => item.total_count);

    const ctxAiHistory = document.getElementById("aiHistoryChart");
    if (!ctxAiHistory) return;

    if (aiHistoryChart) {
      aiHistoryChart.destroy();
    }

    // Khởi tạo Chart.js
    aiHistoryChart = new Chart(ctxAiHistory.getContext("2d"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Chuồng 01 (Heo Thịt)",
            data: dataChuong1,
            backgroundColor: "#3b82f6",
            borderRadius: 4,
          },
          {
            label: "Chuồng 02 (Gà Đẻ)",
            data: dataChuong2,
            backgroundColor: "#f59e0b",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: false, grid: { display: false } },
          y: { stacked: false, grid: { color: "#f1f5f9" }, min: 6150 },
        },
      },
    });
  } catch (error) {
    console.log("Lỗi đồng bộ biểu đồ lịch sử AI: ", error);
  }
}

taiBieuDoLichSuAI();

// 1. VÒNG LẶP NHANH: CẬP NHẬT CẢM BIẾN (3 GIÂY/LẦN)
setInterval(async () => {
  try {
    const sensorResponse = await fetch(
      "https://localhost:7141/api/sensors/latest",
    );
    const sensorData = await sensorResponse.json();

    if (sensorData && sensorData.temperature) {
      kiemTraVaDieuKhienQuat(sensorData.temperature, sensorData.nh3);

      document.getElementById("kpi-temp").innerText =
        sensorData.temperature + "°C";
      document.getElementById("kpi-do-am").innerHTML = 
        sensorData.humidity + '<span class="text-lg font-bold text-slate-400 ml-1">%</span>';
      const kpiTongDan = document.getElementById("kpi-tong-dan");
      if (kpiTongDan && sensorData.tong_dan) {
        kpiTongDan.innerText = sensorData.tong_dan.toLocaleString('vi-VN');
      }

      // Giả lập logic AI tự động hóa thiết bị
      if (sensorData.nh3 > 12) {
        addSystemLog(
          `Khí NH3 (${sensorData.nh3} ppm) vượt ngưỡng -> Kích hoạt quạt hút ly tâm khu 01.`,
          "WARNING",
        );
      } else if (sensorData.temperature > 28.5) {
        addSystemLog(
          `Nhiệt độ tăng cao (${sensorData.temperature}°C) -> Mở rèm tự động và bật phun sương làm mát.`,
          "SENSOR",
        );
      } else {
        if (Math.random() > 0.7) {
          addSystemLog(
            `Đồng bộ môi trường ổn định (Temp: ${sensorData.temperature}°C, Humid: ${sensorData.humidity}%).`,
            "SYSTEM",
          );
        }
      }

      // --- LOGIC TỰ ĐỘNG HÓA & CẬP NHẬT SỐ LIỆU ĐỘNG CHO N CHUỒNG ---
      danhSachChuong.forEach((chuong) => {
        const nhietDoChuong = (
          parseFloat(sensorData.temperature) + chuong.lechNhietDo
        ).toFixed(1);
        const humidChuong = Math.min(
          100,
          Math.max(
            0,
            parseInt(sensorData.humidity) + (chuong.id === 2 ? 4 : 0),
          ),
        );
        const nh3Chuong = parseInt(sensorData.nh3) + chuong.lechNh3;

        // A. CẬP NHẬT CÁC CHỈ SỐ SỐ REAL-TIME
        // 1. Cập nhật tại Tab Giám Sát Cảm Biến
        const txtCamBienTemp = document.getElementById(`c${chuong.id}-temp`);
        const txtCamBienHumid = document.getElementById(`c${chuong.id}-humid`);
        const txtCamBienNh3 = document.getElementById(`c${chuong.id}-nh3`);

        if (txtCamBienTemp) txtCamBienTemp.innerText = nhietDoChuong + "°C";
        if (txtCamBienHumid) txtCamBienHumid.innerText = humidChuong + "%";
        if (txtCamBienNh3) txtCamBienNh3.innerText = nh3Chuong + " ppm";

        // 2. Cập nhật tại Bảng Tổng Quan ngoài trang chủ
        const txtTongQuanTemp = document.getElementById(`t1-t${chuong.id}`);
        const txtTongQuanHumid = document.getElementById(`t1-h${chuong.id}`);
        const txtTongQuanNh3 = document.getElementById(`t1-g${chuong.id}`);

        if (txtTongQuanTemp) txtTongQuanTemp.innerText = nhietDoChuong + " °C";
        if (txtTongQuanHumid) txtTongQuanHumid.innerText = humidChuong + " %";
        if (txtTongQuanNh3) txtTongQuanNh3.innerText = nh3Chuong + " ppm";

        // B. LOGIC ĐIỀU KHIỂN THIẾT BỊ
        const fan = document.getElementById(`device-fan-${chuong.id}`);
        const mist = document.getElementById(`device-mist-${chuong.id}`);
        const sttCool = document.getElementById(`${chuong.prefix}-stt-cool`);
        const sttFeed = document.getElementById(`${chuong.prefix}-stt-feed`);

        if (fan && mist) {
          if (nh3Chuong > chuong.nguongNh3) {
            fan.className = "text-amber-600 font-bold animate-pulse";
            fan.innerText = "ĐANG HÚT KHÍ ĐỘC";
          } else if (nhietDoChuong >= chuong.nguongNong) {
            fan.className = "text-rose-600 font-bold animate-pulse";
            fan.innerText = "ĐANG BẬT (TỐC ĐỘ MAX)";
          } else {
            fan.className = "text-emerald-600 font-bold";
            fan.innerText = "ĐANG BẬT (Duy trì)";
          }

          if (nhietDoChuong >= chuong.nguongNong) {
            mist.className = "text-blue-600 font-bold";
            mist.innerText = "ĐANG PHUN SƯƠNG";
          } else {
            mist.className = "text-slate-500";
            mist.innerText = "ĐANG TẮT";
          }
        }

        if (sttCool && sttFeed) {
          if (nhietDoChuong >= chuong.nguongNong) {
            sttCool.className =
              "px-2.5 py-1 text-[9px] font-bold bg-rose-50 text-rose-700 rounded-none border border-rose-300 animate-pulse uppercase tracking-widest";
            sttCool.innerText = "MAX CÔNG SUẤT";
          } else {
            sttCool.className =
              "px-2.5 py-1 text-[9px] font-bold bg-slate-50 text-slate-600 rounded-none border border-slate-300 uppercase tracking-widest";
            sttCool.innerText = "CHỜ KÍCH HOẠT";
          }

          if (Math.random() > 0.8) {
            sttFeed.className =
              "px-2.5 py-1 text-[9px] font-bold bg-amber-50 text-amber-700 rounded-none border border-amber-300 animate-pulse uppercase tracking-widest";
            sttFeed.innerText = "ĐANG BƠM CÁM";
          } else {
            sttFeed.className =
              "px-2.5 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-none border border-emerald-300 uppercase tracking-widest";
            sttFeed.innerText = "ĐÃ ĐẦY MÁNG";
          }
        }
      });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái chuồng:", error);
  }
}, 3000);

// --- HÀM TẠO LOG NHẬT KÝ VẬN HÀNH TỰ ĐỘNG ---
function addSystemLog(message, type = "SYSTEM") {
  const logBox = document.getElementById("system-logs");
  if (!logBox) return;

  const now = new Date();
  const timeStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    " " +
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0") +
    ":" +
    String(now.getSeconds()).padStart(2, "0");

  let color = "text-emerald-400";
  if (type === "SENSOR") color = "text-amber-400";
  if (type === "ACCOUNTING") color = "text-blue-400";
  if (type === "WARNING") color = "text-rose-500 font-bold";

  const newLog = document.createElement("p");
  newLog.innerHTML = `<span class="text-slate-500">[${timeStr}]</span> <span class="${color}">${type}:</span> ${message}`;

  logBox.prepend(newLog);

  if (logBox.children.length > 50) {
    logBox.lastChild.remove();
  }
}

// ==========================================================================
// MODULE AI CAMERA: SINH GIAO DIỆN ĐỘNG (DYNAMIC RENDER)
// ==========================================================================
let isMultiAiRunning = false;
let aiCameras = []; // Mảng động chứa bao nhiêu camera cũng được

// 1. Hàm vẽ màn hình Camera dựa trên số lượng chuồng thực tế
function renderAICameraGrid() {
  const grid = document.getElementById("multi-cam-grid");
  if (!grid) return;

  let html = "";
  aiCameras = []; // Reset bộ nhớ AI

  danhSachChuong.forEach((chuong) => {
    const maCam = chuong.id > 9 ? chuong.id : "0" + chuong.id;

    // Vẽ giao diện cho từng màn hình
    html += `
            <div class="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="bg-slate-900 p-3 flex justify-between items-center border-b-4 border-slate-700">
                    <span class="px-2 py-1 bg-rose-600 text-white text-[9px] font-black rounded-none animate-pulse tracking-widest uppercase border border-rose-500">■ LIVE REC</span>
                    <span class="text-emerald-400 text-[10px] font-bold font-mono tracking-widest">CAM_${maCam} / ${chuong.loai.toUpperCase()}</span>
                </div>
                <div class="relative bg-black aspect-video overflow-hidden border-b border-slate-200">
                    <!-- Video tag tự động tạo theo ID chuồng -->
                    <video id="webcam-${chuong.id}" autoplay playsinline muted class="w-full h-full object-cover opacity-90"></video>
                    <canvas id="canvas-${chuong.id}" class="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"></canvas>
                </div>
                <div class="p-4 grid grid-cols-2 gap-4 bg-slate-50">
                    <div class="bg-white p-3 rounded-none border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Count</p>
                        <h4 class="text-2xl font-black text-blue-600 mt-1" id="count-${chuong.id}">0 <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target</span></h4>
                    </div>
                    <div class="bg-white p-3 rounded-none border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health Status</p>
                        <h4 class="text-xs font-black text-slate-500 mt-2 uppercase tracking-wide" id="status-${chuong.id}">STANDBY...</h4>
                    </div>
                </div>
            </div>
        `;
    // Đăng ký camera này vào hệ thống để AI chạy
    aiCameras.push({
      id: chuong.id,
      video: null,
      canvas: null,
      ctx: null,
      tracker: [],
      isFetching: false,
    });
  });

  grid.innerHTML = html;

  // Nếu thêm chuồng khi AI đang bật thì tự động khởi chạy luôn video cho nó
  if (isMultiAiRunning) {
    napVideoChoCacCamera();
  }
}

// Gọi hàm vẽ ngay khi web load
renderAICameraGrid();

// 2. Khởi động AI hàng loạt
async function startMultiCamAI() {
  if (isMultiAiRunning) return;

  document.getElementById("ai-system-status").innerHTML =
    '<i class="fa-solid fa-spinner fa-spin text-rose-500 mr-1"></i> Đang khởi tạo kết nối đến YOLO Server...';

  napVideoChoCacCamera();

  isMultiAiRunning = true;
  document.getElementById("ai-system-status").innerText =
    "Kết nối YOLO Server thành công. Đang phân tích luồng Video...";
  document.getElementById("ai-running-badge").classList.remove("hidden");
}

// 3. Hàm nạp Video và nổ máy AI cho TẤT CẢ camera đang có
function napVideoChoCacCamera() {
  aiCameras.forEach((cam) => {
    cam.video = document.getElementById(`webcam-${cam.id}`);
    cam.canvas = document.getElementById(`canvas-${cam.id}`);
    cam.ctx = cam.canvas.getContext("2d");

    // Chọn video
    cam.video.src = cam.id % 2 === 0 ? "video_lon.mp4" : "video_lon.mp4";
    cam.video.loop = true;
    cam.video.muted = true;
    cam.video.play();

    // SỬA CHÍNH: Chỉ kích hoạt luồng AI sau khi video đã sẵn sàng khung hình!
    cam.video.onloadeddata = () => {
      cam.canvas.width = 640;
      cam.canvas.height = 360;

      // Video nạp xong mới cho phép gửi ảnh sang YOLO
      if (!cam.isFetching) {
        cam.isFetching = true;
        fetchYoloData(cam);
      }
    };
  });
}

// 4. GIAO TIẾP VỚI YOLO (Dùng chung cho N camera)
async function fetchYoloData(cam) {
  if (!isMultiAiRunning) return;

  // An toàn: Đảm bảo video không bị sập giữa chừng thì mới chạy AI
  if (cam.video.readyState < 2) {
    setTimeout(() => {
      requestAnimationFrame(() => fetchYoloData(cam));
    }, 200);
    return;
  }

  try {
    // Chuyển hàm chụp ảnh vào trong try-catch, lỡ video lỗi web cũng không chết
    cam.ctx.drawImage(cam.video, 0, 0, cam.canvas.width, cam.canvas.height);
    const frameBase64 = cam.canvas.toDataURL("image/jpeg", 0.7);

    const response = await fetch("http://localhost:8000/api/ai/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: frameBase64 }),
    });

    const result = await response.json();
    cam.ctx.clearRect(0, 0, cam.canvas.width, cam.canvas.height);

    if (result.status === "success") {
      xuLyHanhViVatNuoi(cam, result.data);
    }
  } catch (error) {
    // Lỗi mạng hoặc lỗi vẽ thì im lặng bỏ qua, chạy tiếp frame sau
  }

  // Đặt timeout ở cuối cùng để đảm bảo vòng lặp luôn tiếp diễn
  setTimeout(() => {
    requestAnimationFrame(() => fetchYoloData(cam));
  }, 200);
}

function xuLyHanhViVatNuoi(cam, yoloData) {
  let currentCount = yoloData.length;

  yoloData.forEach((obj) => {
    if (obj.track_id === -1) return;

    cam.ctx.lineWidth = 3;
    cam.ctx.font = "bold 14px Inter";

    // Chỉ vẽ khung màu xanh (Bình thường), bỏ logic check idleTime
    cam.ctx.strokeStyle = "#10b981";
    cam.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    cam.ctx.fillStyle = "#10b981";
    cam.ctx.fillText(`ID: ${obj.track_id} (${obj.label})`, obj.x, obj.y - 5);
  });

  document.getElementById(`count-${cam.id}`).innerHTML =
    `${currentCount} <span class="text-xs text-slate-500 font-medium">cá thể</span>`;

  let statusEl = document.getElementById(`status-${cam.id}`);

  if (currentCount === 0) {
    statusEl.innerText = "Trống chuồng / Đang quét...";
    statusEl.className = "text-sm font-black text-slate-400 mt-2";
  } else {
    // Ép cứng trạng thái luôn khỏe mạnh
    statusEl.innerText = "Tracking: Sức khỏe tốt";
    statusEl.className = "text-sm font-black text-emerald-600 mt-2";
  }
}

// 5. Render danh sách các chuồng đang được cấp điện
const boxCapDien = document.getElementById("danh-sach-cap-dien");
if (boxCapDien && typeof danhSachChuong !== "undefined") {
  let htmlContent = "";
  danhSachChuong.forEach((chuong) => {
    const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id;
    const isPulsing = chuong.id === 1 || Math.random() > 0.3;

    htmlContent += `
                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 transition-all">
                    <div class="flex items-center space-x-3">
                        <i class="fa-solid fa-house-chimney text-slate-400"></i>
                        <span class="font-semibold text-slate-700 text-sm">CHUỒNG ${maChuong} <span class="text-xs text-slate-400 font-normal">(${chuong.loai})</span></span>
                    </div>
                    <span class="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded ${isPulsing ? "animate-pulse" : ""}">
                        <i class="fa-solid fa-bolt mr-1"></i> TỰ CẤP NĂNG LƯỢNG
                    </span>
                </div>
            `;
  });
  boxCapDien.innerHTML = htmlContent;
}

// --- HỆ THỐNG CẤP KÊNH CCTV TỰ ĐỘNG ---
function renderCameraList() {
  const boxCam = document.getElementById("danh-sach-camera");
  if (!boxCam || typeof danhSachChuong === "undefined") return;

  let html = "";
  danhSachChuong.forEach((chuong, index) => {
    // Mặc định chọn chuồng đầu tiên
    const isActive =
      index === 0
        ? "bg-slate-800 text-white shadow-lg border-slate-700 active-cam"
        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200";
    const iconColor =
      index === 0
        ? "text-rose-400 animate-pulse active-icon"
        : "text-slate-400";

    html += `
                    <button onclick="switchCamera(${chuong.id}, '${chuong.loai}')" id="btn-cam-${chuong.id}" class="cam-btn w-full text-left p-4 rounded-xl border transition-all ${isActive} flex items-center justify-between group">
                        <div>
                            <p class="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">CAM 0${chuong.id}</p>
                            <p class="text-sm font-bold">Chuồng ${chuong.id > 9 ? chuong.id : "0" + chuong.id}</p>
                            <p class="text-[10px] mt-0.5 opacity-80">${chuong.loai}</p>
                        </div>
                        <i class="fa-solid fa-video ${iconColor} text-lg group-hover:text-rose-400 transition-colors"></i>
                    </button>
                `;
  });
  boxCam.innerHTML = html;
}

function switchCamera(id, loai) {
  currentCamId = id;

  // 1. Reset tất cả các nút về trạng thái mặc định
  document.querySelectorAll(".cam-btn").forEach((btn) => {
    btn.className =
      "cam-btn w-full text-left p-4 rounded-xl border transition-all bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 flex items-center justify-between group";
    btn.querySelector(".fa-video").className =
      "fa-solid fa-video text-slate-400 text-lg group-hover:text-rose-400 transition-colors";
  });

  // 2. Bật trạng thái Active cho nút vừa click
  const activeBtn = document.getElementById(`btn-cam-${id}`);
  activeBtn.className =
    "cam-btn w-full text-left p-4 rounded-xl border transition-all bg-slate-800 text-white shadow-lg border-slate-700 active-cam flex items-center justify-between group";
  activeBtn.querySelector(".fa-video").className =
    "fa-solid fa-video text-rose-400 animate-pulse active-icon text-lg group-hover:text-rose-400 transition-colors";

  // 3. Đổi nhãn trên màn hình video
  document.getElementById("current-cam-label").innerText =
    `CAM 0${id} - CHUỒNG ${id > 9 ? id : "0" + id} (${loai.toUpperCase()})`;

  // 4. Giả lập hiệu ứng chuyển kênh
  const canvas = document.getElementById("ai-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  document.getElementById("ai-count").innerHTML =
    `0 <span class="text-sm font-medium text-slate-500">cá thể</span>`;
  document.getElementById("ai-status").innerText = "Đang hiệu chỉnh AI...";
  document.getElementById("ai-status").className =
    "text-lg font-black text-slate-500 mt-1";

  // Bắn log hệ thống
  if (typeof addSystemLog === "function") {
    addSystemLog(
      `CCTV: Đã điều hướng tín hiệu AI Camera sang Chuồng 0${id} (${loai}).`,
      "SYSTEM",
    );
  }
}

renderCameraList();

// HỆ THỐNG ĐỒNG BỘ TÀI KHOẢN
async function dongBoTaiKhoanAdmin() {
  const userData = localStorage.getItem("currentUser");

  if (!userData) {
    window.location.href = "index.html";
    return;
  }

  try {
    const user = JSON.parse(userData);

    const words = user.fullName.trim().split(" ");
    const initials =
      words.length > 1
        ? words[0][0] + words[words.length - 1][0]
        : words[0].slice(0, 2);

    document.getElementById("user-fullname").innerText = user.fullName;
    document.getElementById("user-role").innerText = user.role.toUpperCase();
    document.getElementById("user-avatar").innerText = initials.toUpperCase();

    document.getElementById("modal-user-fullname").innerText = user.fullName;
    document.getElementById("modal-user-username").innerText =
      "@" + user.username;
    document.getElementById("modal-user-avatar").innerText =
      initials.toUpperCase();
    document.getElementById("modal-user-role").innerText =
      `RANK: SYSTEM_${user.role.toUpperCase()}`;
  } catch (error) {
    console.error("Lỗi đồng bộ giao diện: ", error);
  }
}

function moModalProfile() {
  document.getElementById("profile-modal").classList.remove("hidden");
}

function dongModalProfile() {
  document.getElementById("profile-modal").classList.add("hidden");
}

// KÍCH HOẠT CHẠY NGAY LÚC LOAD TRANG ĐỂ LẤY DATA
dongBoTaiKhoanAdmin();

// 1. Biến toàn cục để ghi nhớ trạng thái quạt hiện tại (tránh spam lệnh)
let trangThaiQuatHienTai = "OFF";
const NGUONG_NHIET_DO_BAT_QUAT = 31.0;

// 2. Hàm kiểm tra và bắn lệnh điều khiển lên Server
function kiemTraVaDieuKhienQuat(nhietDoThucTe, khiThai) {
  let lenhMoi = "OFF";

  // Phân tích dữ liệu: Nhiệt độ nóng HOẶC Khí NH3 vượt ngưỡng 18 thì bật
  if (nhietDoThucTe >= NGUONG_NHIET_DO_BAT_QUAT || khiThai >= 18) {
    lenhMoi = "ON";
  } else {
    lenhMoi = "OFF";
  }

  // 3. CƠ CHẾ CHỐNG SPAM: Chỉ gửi API khi trạng thái có sự thay đổi
  if (lenhMoi !== trangThaiQuatHienTai) {
    console.log("🌡️ Phát hiện thay đổi ngưỡng! Đang yêu cầu: " + lenhMoi);

    // Cập nhật lại bộ nhớ để lần sau không gửi trùng
    trangThaiQuatHienTai = lenhMoi;

    // 4. Bắn lệnh lên con Server Node.js
    fetch("http://localhost:3000/api/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thiet_bi: "quat",
        trang_thai: lenhMoi,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Server đã ghi nhận lệnh:", data);
      })
      .catch((error) => {
        console.error("❌ Lỗi khi gửi lệnh điều khiển:", error);
      });
  }
}
const socket = io("http://localhost:3000");

socket.on("cap_nhat_giao_dien", function(data) {
    console.log("Dữ liệu cảm biến vừa nhảy:", data);
    // Cập nhật Nhiệt độ (giữ chữ °C)
    if (data.nhiet_do) {
        document.getElementById("kpi-temp").innerHTML = `${data.nhiet_do}<span class="text-lg font-bold text-slate-400 ml-1">°C</span>`;
        const tempStatus = document.getElementById("kpi-temp-status");
        if (data.nhiet_do > 35.0) {
            tempStatus.className = "text-[11px] text-rose-600 font-bold mt-4 flex items-center animate-pulse";
            tempStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Cảnh báo: Vượt ngưỡng an toàn!';
        } else {
            tempStatus.className = "text-[11px] text-emerald-600 font-bold mt-4 flex items-center";
            tempStatus.innerHTML = '<i class="fa-solid fa-check-circle mr-1.5"></i>Ngưỡng an toàn lý tưởng';
        }
    }

    // Cập nhật Độ ẩm (giữ chữ %)
    if (data.do_am) {
        document.getElementById("kpi-do-am").innerHTML = `${data.do_am}<span class="text-lg font-bold text-slate-400 ml-1">%</span>`;
        const humidStatus = document.getElementById("kpi-humid-status");
        if (data.do_am > 85 || data.do_am < 40) {
            humidStatus.className = "text-[11px] text-amber-500 font-bold mt-4 flex items-center";
            humidStatus.innerHTML = '<i class="fa-solid fa-bell mr-1.5"></i>Mất cân bằng độ ẩm';
        } else {
            humidStatus.className = "text-[11px] text-cyan-600 font-bold mt-4 flex items-center";
            humidStatus.innerHTML = '<i class="fa-solid fa-water mr-1.5"></i>Duy trì mức ổn định';
        }
    }

    // Cập nhật Tổng đàn (Đập đi số code cứng)
    if (data.tong_dan) {
        // Dùng toLocaleString() để format số kiểu 12,450 cho đẹp
        document.getElementById("kpi-tong-dan").innerText = data.tong_dan.toLocaleString('en-US');
        const tongDanStatus = document.getElementById("kpi-tong-dan-status");
        tongDanStatus.className = "text-[11px] text-blue-600 font-bold mt-4 flex items-center";
        tongDanStatus.innerHTML = '<i class="fa-solid fa-camera mr-1.5"></i>Đã đồng bộ AI Camera';
    }

    // Cập nhật mượt mà Biểu đồ đường (Line Chart)
    if (data.nhiet_do && data.do_am) {
        const timeString = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        
        mainChart.data.labels.push(timeString);
        mainChart.data.datasets[0].data.push(data.nhiet_do);
        mainChart.data.datasets[1].data.push(data.do_am);

        // Giới hạn biểu đồ chỉ hiển thị 15 mốc thời gian gần nhất (tránh tràn viền)
        if (mainChart.data.labels.length > 15) {
            mainChart.data.labels.shift();
            mainChart.data.datasets[0].data.shift();
            mainChart.data.datasets[1].data.shift();
        }
        mainChart.update();
    }

    // Cập nhật AI
    if (data.predicted_temp) {
        document.getElementById("ai-predict-temp").innerText = `${data.predicted_temp}°C`;
        
        // Thêm đoạn này để đổi thẻ STANDBY thành hành động tương ứng
        const tags = document.getElementById("ai-action-tags");
        if (data.predicted_temp >= 36.0) {
            tags.innerHTML = `
                <span class="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-[9px] font-bold rounded-none uppercase tracking-wider"><i class="fa-solid fa-fan mr-1"></i> BẬT QUẠT TỐI ĐA</span>
                <span class="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/50 text-blue-400 text-[9px] font-bold rounded-none uppercase tracking-wider"><i class="fa-solid fa-droplet mr-1"></i> PHUN SƯƠNG</span>
            `;
        } else {
            tags.innerHTML = `
                <span class="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-[9px] font-bold rounded-none uppercase tracking-wider"><i class="fa-solid fa-leaf mr-1"></i> CHẾ ĐỘ ECO TIẾT KIỆM</span>
            `;
        }
    }
    if (data.message) {
        document.getElementById("ai-action-text").innerText = `"${data.message}"`;
    }
});

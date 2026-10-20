// Đồng hồ đếm thời gian thực
setInterval(() => {
  const now = new Date(); // Lấy thời gian hiện tại
  document.getElementById("live-clock").innerText =
    now.toLocaleTimeString("vi-VN") + " | " + now.toLocaleDateString("vi-VN"); // Cập nhật đồng hồ mỗi giây
}, 1000); 

// Logic chuyển tab 
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content") // Lấy tất cả các tab-content
    .forEach((tab) => tab.classList.add("hidden")); // Ẩn tất cả các tab-content
  document.getElementById("tab-" + tabId).classList.remove("hidden"); // Hiển thị tab-content tương ứng với tabId

  document.querySelectorAll("nav a").forEach((menu) => {
    menu.classList.remove("active-menu"); 
    menu.classList.add("hover:text-blue-500"); 
  });
  const currentMenu = document.getElementById("menu-" + tabId);
  currentMenu.classList.add("active-menu");
  currentMenu.classList.remove("hover:text-blue-500");
// Cập nhật tiêu đề trang
  if (tabId === 'ai-camera') {
      startMultiCamAI();
  }
}

// Cấu hình biểu đồ
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#64748b";

const ctxMain = document.getElementById("mainDashboardChart").getContext("2d"); // Lấy ngữ cảnh vẽ cho biểu đồ chính
const mainChart = new Chart(ctxMain, { // Khởi tạo biểu đồ chính
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

// Biến toàn cục rỗng, chờ lấy dữ liệu từ backend
let danhSachChuong = [];

function layUserIdHienTai() {
  try {
    const raw = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const user = raw.data || raw; // Lấy dữ liệu bên trong .data nếu có
    const uname = (user.username || raw.username || "").toLowerCase();

    // Tài khoản admin gốc hoặc hoangpd luôn có ID = 1
    if (uname === "admin" || uname === "hoangpd") return 1;
    if (user.id) return Number(user.id);
    if (raw.id) return Number(raw.id);
  } catch (e) {}
  return 1;
}

// Hỏi dữ liệu chuồng thuộc về đúng UserId đang đăng nhập
function locChuongTheoUser(allBarns) {
  const uid = layUserIdHienTai();
  return allBarns.filter((c) => {
    const prefix = String(c.prefix || c.Prefix || "");
    const barnUserId = c.userId ?? c.UserId;
    if (barnUserId !== undefined && barnUserId !== null) {
      return Number(barnUserId) === uid;
    }
    // Nếu Backend C# chưa trả cột UserId thì đọc mã u{uid}_ trong Prefix
    if (prefix.startsWith(`u${uid}_`)) return true;
    // Các chuồng cũ (t378, t756...) chưa có tiền tố u_ thì thuộc về Admin gốc (uid = 1)
    if (uid === 1 && !prefix.startsWith("u")) return true;
    return false;
  });
}

// 1. Lấy dữ liệu từ Backend (Có chống lỗi 500 Server Error)
async function loadDanhSachChuong() {
  try {
    const response = await fetch("/api/barn");
    if (response.ok) {
      const allBarns = await response.json();
      danhSachChuong = locChuongTheoUser(allBarns);

      renderBangCrudChuong(danhSachChuong);
      renderGiaoDienChuongTrai();
      renderCameraList();
      renderAICameraGrid();
      renderDanhSachVanHanhNhanh(danhSachChuong);

      if (danhSachChuong.length > 0) {
        startMultiCamAI();
      } else {
        hienThiTrangThaiTrong();
      }
    } else {
      // Nếu Backend C# trả về lỗi 500 do chưa cập nhật bảng barns, tự động giả lập mảng trống cho tài khoản mới
      console.warn("Backend API /api/barn đang lỗi 500, tải dữ liệu trống theo tài khoản...");
      danhSachChuong = [];
      renderBangCrudChuong(danhSachChuong);
      renderGiaoDienChuongTrai();
      renderDanhSachVanHanhNhanh(danhSachChuong);
      hienThiTrangThaiTrong();
    }
  } catch (error) {
    console.error("Lỗi kết nối CSDL, hiển thị không gian trống:", error);
    danhSachChuong = [];
    renderBangCrudChuong(danhSachChuong);
    renderGiaoDienChuongTrai();
    renderDanhSachVanHanhNhanh(danhSachChuong);
    hienThiTrangThaiTrong();
  }
}

function hienThiTrangThaiTrong() {
  const kpiDan = document.getElementById("kpi-tong-dan");
  if (kpiDan) kpiDan.innerText = "0 cá thể";
  const kpiDanStt = document.getElementById("kpi-tong-dan-status");
  if (kpiDanStt) kpiDanStt.innerHTML = '<i class="fa-solid fa-circle-info mr-1"></i> Chưa có chuồng nuôi';
  const liveNh3 = document.getElementById("live-nh3");
  if (liveNh3) liveNh3.innerText = "0.0";
}

loadDanhSachChuong();


// 2. XÓA CHUỒNG (GỌI API DELETE REAL)
async function xoaChuong(id) { 
  if (
    confirm(
      `Xóa Node Chuồng ID-${id} có thể làm mất cảm biến IoT!`,
    )
  ) {
    try {
      await fetch(`/api/barn/${id}`, {
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

// Hàm phụ trợ lưu/đọc nhanh link Camera trên trình duyệt (đảm bảo chạy ngay cả khi Backend C# chưa build lại)
function layCameraUrlCuaChuong(chuong) {
  const localMap = JSON.parse(localStorage.getItem("vigga_camera_urls") || "{}");
  return chuong.cameraUrl || chuong.CameraUrl || localMap[chuong.id] || (chuong.id === 1 ? "EZVIZ_STREAM" : "video_lon.mp4");
}

function luuCameraUrlLocal(id, url) {
  if (!id) return;
  const localMap = JSON.parse(localStorage.getItem("vigga_camera_urls") || "{}");
  localMap[id] = url;
  localStorage.setItem("vigga_camera_urls", JSON.stringify(localMap));
}

// 3. LƯU CHUỒNG (GỌI API POST HOẶC PUT REAL)
async function luuChuong(event) {
  event.preventDefault();

  const id = document.getElementById("chuongId").value;
  const cameraUrlInput = (document.getElementById("chuongCameraUrl")?.value || "").trim();

  const payload = {
    loai: document.getElementById("chuongLoai").value,
    lechNhietDo: parseFloat(document.getElementById("chuongLechNhiet").value),
    lechNh3: parseFloat(document.getElementById("chuongLechNh3").value),
    nguongNong: parseFloat(document.getElementById("chuongNguongNong").value),
    nguongNh3: parseFloat(document.getElementById("chuongNguongNh3").value),
    cameraUrl: cameraUrlInput,
  };

  try {
    if (id) {
      const existingBarn = danhSachChuong.find((c) => c.id == id);
      payload.id = parseInt(id);
      payload.prefix = existingBarn.prefix;
      payload.userId = existingBarn.userId ?? layUserIdHienTai();

      luuCameraUrlLocal(id, cameraUrlInput);

      await fetch(`/api/barn/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      addSystemLog(
        `HỆ THỐNG: Quản trị viên đã cập nhật cấu hình & Camera cho chuồng ID-${id}.`,
        "SYSTEM"
      );
    } else {
      const uid = layUserIdHienTai();
      payload.userId = uid;
      payload.prefix = `u${uid}_t` + Math.floor(Math.random() * 1000);
      const res = await fetch("/api/barn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) luuCameraUrlLocal(created.id, cameraUrlInput);
      }
      addSystemLog(
        `HỆ THỐNG: Đã mở rộng quy mô, đấu nối thành công chuồng mới (${payload.loai}).`,
        "ACCOUNTING"
      );
    }

    dongModalChuong();
    loadDanhSachChuong();
  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);
  }
}

function renderGiaoDienChuongTrai() {
  const bangTrangThai = document.getElementById("bang-trang-thai-chuong"); // Bảng tổng quan trạng thái chuồng
  const luoiCamBien = document.getElementById("luoi-the-cam-bien"); // Lưới thẻ cảm biến

  let htmlBang = ""; 
  let htmlCamBien = "";

  danhSachChuong.forEach((chuong) => {
    const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id; // Định dạng mã chuồng có 2 chữ số
    const mauChuDao = chuong.id % 2 === 0 ? "indigo" : "blue"; // Màu chủ đạo cho từng chuồng 

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

    // 2. Vẽ thẻ cho Tab Giám Sát Cảm Biến (Tối ưu hiển thị gọn đẹp trên cả Điện thoại & PC)
    htmlCamBien += `
        <div class="bg-white p-3.5 sm:p-6 rounded-lg sm:rounded-none border border-slate-200 shadow-sm space-y-3 sm:space-y-5 hover:border-${mauChuDao}-400 transition-colors">
            <div class="flex justify-between items-center border-b border-slate-200 pb-2.5 sm:pb-3 gap-2">
                <h3 class="text-xs sm:text-sm font-black text-slate-800 flex items-center uppercase tracking-wide truncate">
                    <i class="fa-solid fa-microchip mr-1.5 sm:mr-2 text-${mauChuDao}-600 shrink-0"></i>
                    <span class="truncate">NODE ${maChuong} / ${chuong.loai}</span>
                </h3>
                <span class="px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 border border-green-300 text-[8px] sm:text-[9px] font-bold rounded uppercase tracking-widest flex items-center shrink-0">
                    <span class="w-1.5 h-1.5 inline-block bg-green-500 mr-1 animate-pulse rounded-full"></span>Live
                </span>
            </div>
            <div class="grid grid-cols-3 gap-2 sm:gap-4">
                <div class="bg-slate-50 p-2 sm:p-4 rounded text-center border border-slate-200 shadow-inner flex flex-col justify-center">
                    <p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Nhiệt Độ</p>
                    <p class="text-sm sm:text-2xl font-black text-rose-600 mt-1 sm:mt-2 whitespace-nowrap" id="c${chuong.id}-temp">--°C</p>
                </div>
                <div class="bg-slate-50 p-2 sm:p-4 rounded text-center border border-slate-200 shadow-inner flex flex-col justify-center">
                    <p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Độ Ẩm</p>
                    <p class="text-sm sm:text-2xl font-black text-blue-600 mt-1 sm:mt-2 whitespace-nowrap" id="c${chuong.id}-humid">--%</p>
                </div>
                <div class="bg-slate-50 p-2 sm:p-4 rounded text-center border border-slate-200 shadow-inner flex flex-col justify-center">
                    <p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Khí NH3</p>
                    <p class="text-sm sm:text-2xl font-black text-amber-600 mt-1 sm:mt-2 whitespace-nowrap" id="c${chuong.id}-nh3">-- ppm</p>
                </div>
            </div>
            <div class="p-3 sm:p-4 bg-slate-900 rounded border border-slate-800 text-xs space-y-1.5 sm:space-y-2 shadow-inner">
                <h4 class="font-bold text-slate-400 uppercase tracking-wider text-[9px] sm:text-[10px] mb-1.5 sm:mb-2 flex items-center">
                    <i class="fa-solid fa-gears mr-1.5"></i>Trạng thái Tự Động Hóa:
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-300 border-t border-slate-700 pt-2 sm:pt-3 font-mono">
                    <div class="flex justify-between sm:justify-start items-center">
                        <span class="text-slate-400">Quạt thông gió:</span>
                        <b id="device-fan-${chuong.id}" class="text-emerald-400 ml-1 truncate">...</b>
                    </div>
                    <div class="flex justify-between sm:justify-start items-center">
                        <span class="text-slate-400">Làm mát:</span>
                        <b id="device-mist-${chuong.id}" class="text-blue-400 ml-1 truncate">...</b>
                    </div>
                </div>
            </div>
        </div>
    `;
  });

  if (bangTrangThai) bangTrangThai.innerHTML = htmlBang;
  if (luoiCamBien) luoiCamBien.innerHTML = htmlCamBien;
}
renderGiaoDienChuongTrai();

// Chức năng CRUD cho quản lý chuồng trại
// 1. Hàm vẽ (Render) bảng dữ liệu quản lý
function renderBangCrudChuong(data) {
  const tbody = document.getElementById("bang-crud-chuong"); // Lấy tbody của bảng quản lý chuồng trại
  if (!tbody) return;

  // Xây dựng HTML cho từng dòng dữ liệu chuồng trại
  let html = "";
  data.forEach((chuong) => { // Duyệt qua từng chuồng trong danh sách dữ liệu
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
 
  if (data.length === 0) { // Nếu không có dữ liệu chuồng trại, hiển thị thông báo
    html = `<tr><td colspan="7" class="p-8 text-center text-slate-400 italic font-medium">Không tìm thấy dữ liệu chuồng trại...</td></tr>`;
  }

  tbody.innerHTML = html;
}
renderBangCrudChuong(danhSachChuong);

// 8. Hàm tạo thẻ HTML cho phần Vận Hành Nhanh (Đồng bộ trạng thái Quạt & Bơm thật)
function renderDanhSachVanHanhNhanh(data) {
  const listVanHanhNhanh = document.getElementById("danh-sach-van-hanh-nhanh");
  if (!listVanHanhNhanh) return;

  let html = "";

  const tongSoChuong = data.length;
  const badgeSoChuong = document.querySelector("#tab-tong-quan .bg-gray-200.px-2.py-1.rounded");
  if (badgeSoChuong) {
    badgeSoChuong.innerText = `${tongSoChuong} CHUỒNG`;
  }

  data.forEach((chuong) => {
    const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id;

    html += `
      <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-material-purple transition-colors group">
          <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
              <div>
                  <h4 class="text-sm font-bold text-gray-800 group-hover:text-material-purple transition-colors">CHUONG-${maChuong}</h4>
                  <p class="text-[10px] text-gray-500 font-mono mt-0.5">${chuong.loai}</p>
              </div>
              <div class="flex space-x-1">
                  <span id="vh-mist-${chuong.id}" class="bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center" title="Máy bơm phun sương 12V">
                      <i class="fa-solid fa-droplet mr-1"></i> BƠM: TẮT
                  </span>
                  <span id="vh-fan-${chuong.id}" class="bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center" title="Quạt thông gió 12V">
                      <i class="fa-solid fa-fan mr-1"></i> QUẠT: TẮT
                  </span>
              </div>
          </div>
          
          <div class="grid grid-cols-3 gap-2">
              <div class="text-center bg-gray-50 rounded p-1.5 border border-gray-100">
                  <p class="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Nhiệt độ</p>
                  <p class="text-xs font-black text-material-pink" id="vh-temp-${chuong.id}">--°C</p>
              </div>
              <div class="text-center bg-gray-50 rounded p-1.5 border border-gray-100">
                  <p class="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Độ ẩm</p>
                  <p class="text-xs font-black text-material-purple" id="vh-humid-${chuong.id}">--%</p>
              </div>
              <div class="text-center bg-gray-50 rounded p-1.5 border border-gray-100">
                  <p class="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Khí NH3</p>
                  <p class="text-xs font-black text-material-orange" id="vh-nh3-${chuong.id}">-- ppm</p>
              </div>
          </div>
      </div>
    `;
  });

  if (data.length === 0) {
    html = `<p class="text-center text-xs text-gray-400 py-10">Chưa có dữ liệu chuồng trại.</p>`;
  }

  listVanHanhNhanh.innerHTML = html;
}

function locVanHanhNhanh() {
  const keyword = (document.getElementById("search-van-hanh")?.value || "").toLowerCase();
  const cards = document.querySelectorAll("#danh-sach-van-hanh-nhanh > div");
  cards.forEach((card) => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(keyword) ? "" : "none";
  });
}

// 2. Logic Tìm Kiếm 
function timKiemChuong() {
  const keyword = document.getElementById("searchInput").value.toLowerCase(); // Lấy từ khóa tìm kiếm và chuyển về chữ thường
  const filteredData = danhSachChuong.filter((chuong) =>
    chuong.loai.toLowerCase().includes(keyword), // Lọc danh sách chuồng trại dựa trên từ khóa tìm kiếm
  );
  renderBangCrudChuong(filteredData);
}

function moModalChuong(id = null) {
  document.getElementById("modal-crud-chuong").classList.remove("hidden");
  const camInput = document.getElementById("chuongCameraUrl");

  if (id) {
    document.getElementById("modal-crud-title").innerHTML =
      '<i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i>CẬP NHẬT THÔNG TIN CHUỒNG';
    const c = danhSachChuong.find((item) => item.id === id);
    document.getElementById("chuongId").value = c.id;
    document.getElementById("chuongLoai").value = c.loai;
    document.getElementById("chuongLechNhiet").value = c.lechNhietDo;
    document.getElementById("chuongLechNh3").value = c.lechNh3;
    document.getElementById("chuongNguongNong").value = c.nguongNong;
    document.getElementById("chuongNguongNh3").value = c.nguongNh3;
    if (camInput) camInput.value = layCameraUrlCuaChuong(c);
  } else {
    document.getElementById("modal-crud-title").innerHTML =
      '<i class="fa-solid fa-plus mr-2 text-emerald-600"></i>THÊM CHUỒNG MỚI';
    document.getElementById("formChuong").reset();
    document.getElementById("chuongId").value = "";
    if (camInput) camInput.value = "video_lon.mp4";
  }
}

function dongModalChuong() {
  document.getElementById("modal-crud-chuong").classList.add("hidden"); // Ẩn modal
}

// Biểu đồ lịch sử AI
let aiHistoryChart;
async function taiBieuDoLichSuAI() {
  try {
    // Tạm thời ẩn việc gọi API thật đi để tránh lỗi 404
    // const response = await fetch("/api/ai/history");
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

    const ctxAiHistory = document.getElementById("aiHistoryChart"); // Lấy ngữ cảnh vẽ cho biểu đồ lịch sử AI
    if (!ctxAiHistory) return;

    if (aiHistoryChart) {
      aiHistoryChart.destroy(); // Nếu biểu đồ đã tồn tại, hủy nó trước khi tạo mới để tránh trùng lặp
    }

    // Khởi tạo Chart.js
    aiHistoryChart = new Chart(ctxAiHistory.getContext("2d"), { // Tạo biểu đồ mới
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

// =========================================================================
// HỆ THỐNG CẢNH BÁO THỜI GIAN THỰC & NHẬT KÝ TỰ ĐỘNG HÓA (QUẠT + BƠM 12V)
// =========================================================================
const trangThaiChuong = {}; // Ghi nhớ trạng thái từng chuồng để chống spam log mỗi 3 giây
let chiLocCanhBao = false;  // Trạng thái nút "Lọc lỗi" ở tab Nhật ký
let soCanhBaoMoi = 0;

// Khởi tạo làm sạch dữ liệu mẫu tĩnh trong HTML ngay khi vào trang
(function khoiTaoHeThongCanhBaoThat() {
  const alertList = document.getElementById("alert-list");
  if (alertList) alertList.innerHTML = "";

  const logBox = document.getElementById("system-logs");
  if (logBox) logBox.innerHTML = "";

  // Gắn sự kiện cho nút "Lọc lỗi" trong tab Nhật ký & Cảnh báo
  const filterBtn = document.querySelector("#tab-nhat-ky button");
  if (filterBtn) {
    filterBtn.onclick = () => {
      chiLocCanhBao = !chiLocCanhBao;
      filterBtn.className = chiLocCanhBao
        ? "bg-rose-600 text-white text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded shadow-sm transition-all"
        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded shadow-sm transition-all";
      filterBtn.innerHTML = chiLocCanhBao
        ? '<i class="fa-solid fa-filter-circle-xmark mr-1"></i> Đang lọc: Cảnh báo & Relay'
        : '<i class="fa-solid fa-filter mr-1"></i> Lọc lỗi';

      document.querySelectorAll("#system-logs p").forEach((p) => {
        const isWarn = p.dataset.type === "WARNING" || p.dataset.type === "RELAY";
        p.style.display = chiLocCanhBao && !isWarn ? "none" : "";
      });
    };
  }

  // Ghi dòng nhật ký khởi động thực tế đầu tiên
  addSystemLog(
    "Khởi động Trung tâm Điều hành IoT Farm. Đã kết nối Server Azure & luồng cảm biến thời gian thực.",
    "SYSTEM"
  );
  dayCanhBaoTrangChu(
    "ok",
    "Hệ thống Giám sát & Relay sẵn sàng",
    "Đang theo dõi ngưỡng Nhiệt độ, Độ ẩm, Khí độc NH3 và điều khiển tự động Quạt + Máy bơm 12V."
  );
})();

// Hàm đẩy thẻ sự kiện mới lên bảng "Cảnh Báo Hệ Thống" ở Trang chủ (#alert-list)
function dayCanhBaoTrangChu(loai, tieuDe, noiDung) {
  const alertList = document.getElementById("alert-list");
  if (!alertList) return;

  const timeStr = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  let iconHtml = "";
  let highlightClass = "bg-emerald-50/40 border-l-4 border-material-teal";

  if (loai === "danger") {
    iconHtml = `<div class="bg-material-pink/10 p-2 rounded-full mt-0.5 shrink-0"><i class="fa-solid fa-fire text-material-pink text-sm w-4 text-center animate-bounce"></i></div>`;
    highlightClass = "bg-rose-50/70 border-l-4 border-material-pink";
    soCanhBaoMoi++;
  } else if (loai === "gas") {
    iconHtml = `<div class="bg-material-orange/15 p-2 rounded-full mt-0.5 shrink-0"><i class="fa-solid fa-wind text-material-orange text-sm w-4 text-center animate-pulse"></i></div>`;
    highlightClass = "bg-amber-50/70 border-l-4 border-material-orange";
    soCanhBaoMoi++;
  } else if (loai === "ai") {
    iconHtml = `<div class="bg-material-purple/10 p-2 rounded-full mt-0.5 shrink-0"><i class="fa-solid fa-eye text-material-purple text-sm w-4 text-center"></i></div>`;
    highlightClass = "bg-indigo-50/60 border-l-4 border-material-purple";
  } else {
    iconHtml = `<div class="bg-material-teal/10 p-2 rounded-full mt-0.5 shrink-0"><i class="fa-solid fa-check text-material-teal text-sm w-4 text-center"></i></div>`;
  }

  // Cập nhật số trên quả chuông thông báo trên Header
  const bellBadge = document.querySelector("header .fa-bell")?.nextElementSibling;
  if (bellBadge && soCanhBaoMoi > 0) {
    bellBadge.innerText = soCanhBaoMoi > 9 ? "9+" : String(soCanhBaoMoi);
  }

  const newLi = document.createElement("li");
  newLi.className = `p-3.5 sm:p-4 hover:bg-gray-50 transition-all duration-500 flex items-start space-x-3 sm:space-x-4 ${highlightClass}`;
  newLi.innerHTML = `
      ${iconHtml}
      <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1 gap-2">
              <h4 class="text-xs font-bold text-gray-800 truncate">${tieuDe}</h4>
              <span class="text-[10px] text-gray-400 font-mono shrink-0">${timeStr}</span>
          </div>
          <p class="text-[11px] text-gray-600 line-clamp-2 sm:line-clamp-1">${noiDung}</p>
      </div>
  `;

  alertList.prepend(newLi);

  // Giữ tối đa 4 cảnh báo mới nhất trên Trang chủ cho gọn đẹp
  while (alertList.children.length > 4) {
    alertList.lastElementChild.remove();
  }
}

// Hàm ghi Nhật ký hệ thống (#system-logs)
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
  if (type === "SENSOR") color = "text-amber-400 font-bold";
  if (type === "RELAY") color = "text-cyan-400 font-bold";
  if (type === "ACCOUNTING") color = "text-blue-400";
  if (type === "AI_VISION") color = "text-purple-400 font-bold";
  if (type === "WARNING") color = "text-rose-500 font-bold";

  const newLog = document.createElement("p");
  newLog.dataset.type = type;
  if (chiLocCanhBao && type !== "WARNING" && type !== "RELAY") {
    newLog.style.display = "none";
  }
  newLog.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="${color}">${type}:</span> ${message}`;

  logBox.prepend(newLog);

  while (logBox.children.length > 60) {
    logBox.lastElementChild.remove();
  }
}

// Vòng lặp cập nhật dữ liệu RIÊNG BIỆT cho từng chuồng mỗi 3 giây (GỌI TỪ /api/barn)
setInterval(async () => {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/barn?t=${timestamp}`);
    if (!response.ok) return;
    const rawBarnsData = await response.json();
    const barnsData = locChuongTheoUser(rawBarnsData);
    danhSachChuong = barnsData;

    let tongNhiet = 0, tongAm = 0, tongNh3 = 0, soChuongCoData = 0;
    let soQuatDangBat = 0;
    let soBomDangBat = 0;

    barnsData.forEach((chuong) => {
      const rawTemp = chuong.nhietDoHienTai ?? chuong.NhietDoHienTai;
      const rawHumid = chuong.doAmHienTai ?? chuong.DoAmHienTai;
      const rawNh3 = chuong.nh3HienTai ?? chuong.Nh3HienTai;

      if (rawTemp !== null && rawTemp !== undefined) {
        const maChuong = chuong.id > 9 ? chuong.id : "0" + chuong.id;
        const lechNhiet = Number(chuong.lechNhietDo ?? chuong.LechNhietDo) || 0;
        const lechKhi = Number(chuong.lechNh3 ?? chuong.LechNh3) || 0;
        const nguongNong = Number(chuong.nguongNong ?? chuong.NguongNong) || 30;
        const nguongKhi = Number(chuong.nguongNh3 ?? chuong.NguongNh3) || 15;

        const nhietDoVal = Number(rawTemp) + lechNhiet;
        const humidVal = Math.min(100, Math.max(0, Number(rawHumid)));
        const nh3Val = Number(rawNh3 || 10) + lechKhi;

        const nhietDoChuong = nhietDoVal.toFixed(1);
        const humidChuong = humidVal.toFixed(1);
        const nh3Chuong = nh3Val.toFixed(1);

        tongNhiet += nhietDoVal;
        tongAm += humidVal;
        tongNh3 += nh3Val;
        soChuongCoData++;

        const isQuaNong = nhietDoVal >= nguongNong;
        const isKhiDocCao = nh3Val >= nguongKhi;
        const isQuatBat = isQuaNong || isKhiDocCao;
        const isBomPhunSuongBat = nhietDoVal >= (nguongNong + 1.0); // Bơm chỉ bật khi cao hơn ngưỡng quạt 1°C

        if (isQuatBat) soQuatDangBat++;
        if (isBomPhunSuongBat) soBomDangBat++;

        // --- KIỂM TRA CHUYỂN TRẠNG THÁI ĐỂ BẮN CẢNH BÁO & GHI NHẬT KÝ THẬT (KHÔNG SPAM) ---
        if (!trangThaiChuong[chuong.id]) {
          trangThaiChuong[chuong.id] = {
            quaNong: false,
            khiDocCao: false,
          };
        }
        const prevState = trangThaiChuong[chuong.id];

        // A. Khi Nhiệt độ VƯỢT ngưỡng -> Báo bật Quạt 12V & Máy bơm phun sương 12V
        if (isQuaNong && !prevState.quaNong) {
          prevState.quaNong = true;
          dayCanhBaoTrangChu(
            "danger",
            `Cảnh báo Nhiệt độ cao - CHUONG-${maChuong} (${chuong.loai})`,
            `Nhiệt độ đạt ${nhietDoChuong}°C (vượt ngưỡng ${nguongNong}°C). Đã tự động BẬT Quạt 12V & Máy bơm phun sương.`
          );
          addSystemLog(
            `CHUONG-${maChuong} (${chuong.loai}): Nhiệt độ tăng lên ${nhietDoChuong}°C (Ngưỡng ${nguongNong}°C) -> Đóng Relay BẬT Quạt làm mát & Máy bơm phun sương 12V.`,
            "WARNING"
          );
        }
        // B. Khi Nhiệt độ HẠ XUỐNG mức an toàn -> Báo tắt Máy bơm phun sương
        else if (!isQuaNong && prevState.quaNong) {
          prevState.quaNong = false;
          dayCanhBaoTrangChu(
            "ok",
            `Nhiệt độ đã ổn định - CHUONG-${maChuong}`,
            `Nhiệt độ giảm về ${nhietDoChuong}°C (< ${nguongNong}°C). Đã tự động NGẮT Máy bơm phun sương 12V.`
          );
          addSystemLog(
            `CHUONG-${maChuong} (${chuong.loai}): Nhiệt độ hạ về mức an toàn (${nhietDoChuong}°C) -> Tự động NGẮT Relay Máy bơm phun sương 12V.`,
            "RELAY"
          );
        }

        // C. Khi Khí độc NH3 VƯỢT ngưỡng -> Báo bật Quạt hút khí độc tối đa
        if (isKhiDocCao && !prevState.khiDocCao) {
          prevState.khiDocCao = true;
          dayCanhBaoTrangChu(
            "gas",
            `Cảnh báo Khí độc NH3 - CHUONG-${maChuong} (${chuong.loai})`,
            `Khí NH3 đạt ${nh3Chuong} ppm (vượt ngưỡng ${nguongKhi} ppm). Đã kích hoạt Quạt hút gió công suất tối đa!`
          );
          addSystemLog(
            `CHUONG-${maChuong} (${chuong.loai}): Phát hiện khí NH3 tăng cao (${nh3Chuong} ppm >= ${nguongKhi} ppm) -> Kích hoạt Relay Quạt thông gió hút khí độc.`,
            "SENSOR"
          );
        }
        // D. Khi Khí độc NH3 GIẢM VỀ an toàn
        else if (!isKhiDocCao && prevState.khiDocCao) {
          prevState.khiDocCao = false;
          dayCanhBaoTrangChu(
            "ok",
            `Khí NH3 về mức an toàn - CHUONG-${maChuong}`,
            `Nồng độ NH3 tại CHUONG-${maChuong} đã giảm xuống ${nh3Chuong} ppm (< ${nguongKhi} ppm).`
          );
          addSystemLog(
            `CHUONG-${maChuong} (${chuong.loai}): Khí NH3 đã được xử lý về ngưỡng an toàn (${nh3Chuong} ppm).`,
            "RELAY"
          );
        }

        // 1. Cập nhật tab Giám sát Cảm biến (Telemetry)
        const txtCamBienTemp = document.getElementById(`c${chuong.id}-temp`);
        const txtCamBienHumid = document.getElementById(`c${chuong.id}-humid`);
        const txtCamBienNh3 = document.getElementById(`c${chuong.id}-nh3`);
        if (txtCamBienTemp) txtCamBienTemp.innerText = nhietDoChuong + "°C";
        if (txtCamBienHumid) txtCamBienHumid.innerText = humidChuong + "%";
        if (txtCamBienNh3) txtCamBienNh3.innerText = nh3Chuong + " ppm";

        // 2. Cập nhật Bảng Tổng Quan
        const txtTongQuanTemp = document.getElementById(`t1-t${chuong.id}`);
        const txtTongQuanHumid = document.getElementById(`t1-h${chuong.id}`);
        const txtTongQuanNh3 = document.getElementById(`t1-g${chuong.id}`);
        if (txtTongQuanTemp) txtTongQuanTemp.innerText = nhietDoChuong + " °C";
        if (txtTongQuanHumid) txtTongQuanHumid.innerText = humidChuong + " %";
        if (txtTongQuanNh3) txtTongQuanNh3.innerText = nh3Chuong + " ppm";

        // 3. Cập nhật thẻ VẬN HÀNH NHANH (Nhiệt độ, Độ ẩm, NH3 + Nhãn Quạt & Bơm thật)
        const txtVHTemp = document.getElementById(`vh-temp-${chuong.id}`);
        const txtVHHumid = document.getElementById(`vh-humid-${chuong.id}`);
        const txtVHNh3 = document.getElementById(`vh-nh3-${chuong.id}`);
        const badgeVHFan = document.getElementById(`vh-fan-${chuong.id}`);
        const badgeVHMist = document.getElementById(`vh-mist-${chuong.id}`);

        if (txtVHTemp) {
          txtVHTemp.innerText = nhietDoChuong + "°C";
          if (isQuaNong) {
            txtVHTemp.classList.replace("text-material-pink", "text-rose-600");
            txtVHTemp.classList.add("animate-pulse");
          } else {
            txtVHTemp.classList.replace("text-rose-600", "text-material-pink");
            txtVHTemp.classList.remove("animate-pulse");
          }
        }
        if (txtVHHumid) txtVHHumid.innerText = humidChuong + "%";
        if (txtVHNh3) {
          txtVHNh3.innerText = nh3Chuong + " ppm";
          if (isKhiDocCao) {
            txtVHNh3.classList.replace("text-material-orange", "text-rose-600");
            txtVHNh3.classList.add("animate-pulse");
          } else {
            txtVHNh3.classList.replace("text-rose-600", "text-material-orange");
            txtVHNh3.classList.remove("animate-pulse");
          }
        }

        // Cập nhật nhãn Quạt 12V trong Vận Hành Nhanh
        if (badgeVHFan) {
          if (isQuatBat) {
            badgeVHFan.className = "text-material-orange border border-material-orange/30 bg-material-orange/10 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center animate-pulse";
            badgeVHFan.innerHTML = '<i class="fa-solid fa-fan fa-spin mr-1"></i> QUẠT: BẬT';
          } else {
            badgeVHFan.className = "text-gray-500 border border-gray-200 bg-gray-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center";
            badgeVHFan.innerHTML = '<i class="fa-solid fa-fan mr-1"></i> QUẠT: TẮT';
          }
        }

        // Cập nhật nhãn Máy bơm phun sương 12V trong Vận Hành Nhanh
        if (badgeVHMist) {
          if (isBomPhunSuongBat) {
            badgeVHMist.className = "bg-blue-50 text-blue-600 border border-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center animate-pulse";
            badgeVHMist.innerHTML = '<i class="fa-solid fa-droplet mr-1"></i> BƠM: BẬT';
          } else {
            badgeVHMist.className = "bg-material-teal/10 text-material-teal border border-material-teal/30 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center";
            badgeVHMist.innerHTML = '<i class="fa-solid fa-droplet mr-1"></i> BƠM: TẮT';
          }
        }

        // 4. Cập nhật trạng thái Quạt & Phun sương ở tab Telemetry
        const fan = document.getElementById(`device-fan-${chuong.id}`);
        const mist = document.getElementById(`device-mist-${chuong.id}`);
        if (fan) {
          if (isKhiDocCao) {
            fan.className = "text-amber-500 font-bold animate-pulse ml-1";
            fan.innerText = "ĐANG HÚT KHÍ ĐỘC";
          } else if (isQuaNong) {
            fan.className = "text-rose-500 font-bold animate-pulse ml-1";
            fan.innerText = "ĐANG BẬT (MAX)";
          } else {
            fan.className = "text-emerald-400 font-bold ml-1";
            fan.innerText = "DUY TRÌ MÁT";
          }
        }
        if (mist) {
          if (isBomPhunSuongBat) {
            mist.className = "text-blue-400 font-bold animate-pulse ml-1";
            mist.innerText = "ĐANG PHUN SƯƠNG";
          } else {
            mist.className = "text-slate-500 ml-1";
            mist.innerText = "ĐANG TẮT";
          }
        }
      }
    });

    // Cập nhật các thẻ KPI Trung bình & Khối Đánh Giá Môi Trường trên Trang chủ
    if (soChuongCoData > 0) {
      const tbNhiet = (tongNhiet / soChuongCoData).toFixed(1);
      const tbAm = (tongAm / soChuongCoData).toFixed(1);
      const tbNh3 = (tongNh3 / soChuongCoData).toFixed(1);

      const elKpiTemp = document.getElementById("kpi-temp");
      const elKpiHumid = document.getElementById("kpi-do-am");
      const elLiveNh3 = document.getElementById("live-nh3");
      const elNh3Badge = document.getElementById("nh3-badge");
      const elLiveFanCount = document.getElementById("live-fan-count");

      if (elKpiTemp) elKpiTemp.innerText = tbNhiet + "°C";
      if (elKpiHumid) elKpiHumid.innerHTML = tbAm + '<span class="text-lg font-bold text-slate-400 ml-1">%</span>';
      if (elLiveNh3) elLiveNh3.innerText = tbNh3;

      // Cập nhật số lượng Quạt đang hoạt động thực tế (thay cho số 2/4 cứng)
      if (elLiveFanCount) {
        elLiveFanCount.innerText = `${soQuatDangBat}/${barnsData.length}`;
      }
      const elLiveMistCount = document.getElementById("live-mist-count");
      if (elLiveMistCount) {
        elLiveMistCount.innerText = `${soBomDangBat}/${barnsData.length}`;
      }

      // Cập nhật Badge đánh giá mức độ khí NH3 thực tế
      if (elNh3Badge) {
        const nh3Num = Number(tbNh3);
        if (nh3Num >= 15) {
          elNh3Badge.className = "text-[10px] font-bold bg-material-pink/10 text-material-pink px-2 py-0.5 rounded border border-material-pink/20 animate-pulse";
          elNh3Badge.innerText = "NGUY HIỂM";
        } else if (nh3Num >= 10) {
          elNh3Badge.className = "text-[10px] font-bold bg-material-orange/10 text-material-orange px-2 py-0.5 rounded border border-material-orange/20";
          elNh3Badge.innerText = "CẢNH BÁO NHẸ";
        } else {
          elNh3Badge.className = "text-[10px] font-bold bg-material-teal/10 text-material-teal px-2 py-0.5 rounded border border-material-teal/20";
          elNh3Badge.innerText = "AN TOÀN";
        }
      }

      const tempStatus = document.getElementById("kpi-temp-status");
      if (tempStatus) {
        if (soQuatDangBat > 0 || soBomDangBat > 0) {
          tempStatus.className = "text-[10px] text-rose-600 font-bold mt-2 flex items-center animate-pulse";
          tempStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Cảnh báo: Đang bật làm mát!';
        } else {
          tempStatus.className = "text-[10px] text-material-teal font-bold mt-2 flex items-center";
          tempStatus.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i> Ngưỡng an toàn lý tưởng';
        }
      }

      const humidStatus = document.getElementById("kpi-humid-status");
      if (humidStatus) {
        humidStatus.className = "text-[10px] text-material-purple font-bold mt-2 flex items-center";
        humidStatus.innerHTML = '<i class="fa-solid fa-droplet mr-1"></i> Duy trì mức ổn định';
      }

      // CẬP NHẬT BIỂU ĐỒ ĐƯỜNG MỖI 3 GIÂY
      if (typeof mainChart !== "undefined") {
        const timeString = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        mainChart.data.labels.push(timeString);
        mainChart.data.datasets[0].data.push(Number(tbNhiet));
        mainChart.data.datasets[1].data.push(Number(tbAm));

        if (mainChart.data.labels.length > 15) {
          mainChart.data.labels.shift();
          mainChart.data.datasets[0].data.shift();
          mainChart.data.datasets[1].data.shift();
        }
        mainChart.update();
      }

      // GỌI AI XGBOOST DỰ BÁO THỜI TIẾT 2 GIỜ TỚI
      try {
        const currentHour = new Date().getHours();
        const aiRes = await fetch("/api/predict-weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nhiet_do: Number(tbNhiet),
            do_am: Number(tbAm),
            gio: currentHour,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const elPredictTemp = document.getElementById("ai-predict-temp");
          if (elPredictTemp && aiData.predicted_temp !== undefined) {
            elPredictTemp.innerText = `${aiData.predicted_temp}°C`;
          }
          const elActionText = document.getElementById("ai-action-text");
          if (elActionText && aiData.message) {
            elActionText.innerText = `"${aiData.message}"`;
          }
        }
      } catch (err) {
        console.error("Lỗi gọi AI dự báo thời tiết:", err);
      }
    }
  } catch (error) {
    console.error("Lỗi cập nhật dữ liệu chuồng:", error);
  }
}, 3000);

// 5. Quản lý AI Camera
let isMultiAiRunning = false;
let aiCameras = []; // Mảng động chứa bao nhiêu camera cũng được

// 1. Hàm vẽ màn hình Camera dựa trên số lượng chuồng thực tế
function renderAICameraGrid() {
  const grid = document.getElementById("multi-cam-grid");
  if (!grid) return;

  let html = "";
  aiCameras = [];

  danhSachChuong.forEach((chuong) => {
    const maCam = chuong.id > 9 ? chuong.id : "0" + chuong.id;
    const camSource = layCameraUrlCuaChuong(chuong);

    html += `
      <div class="bg-white rounded-lg sm:rounded-none border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="bg-slate-900 px-3 py-2 sm:p-3 flex justify-between items-center border-b-2 sm:border-b-4 border-slate-700">
              <span class="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-rose-600 text-white text-[8px] sm:text-[9px] font-black rounded-none animate-pulse tracking-widest uppercase border border-rose-500">■ LIVE REC</span>
              <div class="flex items-center space-x-2 truncate ml-2">
                  <span class="text-emerald-400 text-[9px] sm:text-[10px] font-bold font-mono tracking-wider truncate">CAM_${maCam} / ${chuong.loai.toUpperCase()}</span>
                  <button onclick="moModalChuong(${chuong.id})" class="text-slate-400 hover:text-white text-xs" title="Đổi nguồn Camera"><i class="fa-solid fa-gear"></i></button>
              </div>
          </div>
          <div class="relative bg-black aspect-video overflow-hidden border-b border-slate-200">
              <video id="webcam-${chuong.id}" autoplay playsinline muted crossorigin="anonymous" class="w-full h-full object-cover opacity-90"></video>
              <canvas id="canvas-${chuong.id}" class="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"></canvas>
          </div>
          <div class="p-2.5 sm:p-4 grid grid-cols-2 gap-2.5 sm:gap-4 bg-slate-50">
              <div class="bg-white p-2.5 sm:p-3 rounded border border-slate-200 shadow-sm">
                  <p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Real-time Count</p>
                  <h4 class="text-base sm:text-2xl font-black text-blue-600 mt-0.5 sm:mt-1 whitespace-nowrap" id="count-${chuong.id}">0 <span class="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">cá thể</span></h4>
              </div>
              <div class="bg-white p-2.5 sm:p-3 rounded border border-slate-200 shadow-sm">
                  <p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Health Status</p>
                  <h4 class="text-[11px] sm:text-xs font-black text-slate-500 mt-1 sm:mt-2 uppercase tracking-wide truncate" id="status-${chuong.id}">STANDBY...</h4>
              </div>
          </div>
      </div>
    `;

    aiCameras.push({
      id: chuong.id,
      cameraUrl: camSource,
      video: null,
      canvas: null,
      ctx: null,
      tracker: [],
      isFetching: false,
      lastCount: 0,
    });
  });

  grid.innerHTML = html;

  if (isMultiAiRunning) {
    napVideoChoCacCamera();
  }
}
renderAICameraGrid();

// 2. Khởi động AI hàng loạt (Đã xóa hàm bị trùng)
async function startMultiCamAI() {
  isMultiAiRunning = true;

  const statusEl = document.getElementById("ai-system-status");
  if (statusEl) {
    statusEl.innerText =
      "Kết nối YOLO Server thành công. Đang phân tích luồng Video...";
  }
  const badgeEl = document.getElementById("ai-running-badge");
  if (badgeEl) badgeEl.classList.remove("hidden");

  napVideoChoCacCamera();
}

// 3. Hàm nạp Video và nổ máy AI theo đúng nguồn Camera người dùng đã nhập
function napVideoChoCacCamera() {
  aiCameras.forEach((cam, index) => {
    cam.video = document.getElementById(`webcam-${cam.id}`);
    cam.canvas = document.getElementById(`canvas-${cam.id}`);
    if (!cam.video || !cam.canvas) return;

    cam.ctx = cam.canvas.getContext("2d");
    cam.canvas.width = 640;
    cam.canvas.height = 360;

    const src = (cam.cameraUrl || "").trim();

    // A. NẾU CHỌN CAMERA EZVIZ HOẶC LINK RTSP: Đọc luồng từ Server
    if (src === "EZVIZ_STREAM" || src.startsWith("rtsp://")) {
      cam.video.pause();
      cam.video.removeAttribute("src");
      cam.video.load();
      cam.video.classList.add("hidden");

      if (!cam.isFetching) {
        cam.isFetching = true;
        fetchYoloData(cam);
      }
      return;
    }

    // B. NẾU CHỌN "WEBCAM": Mở trực tiếp Camera của Laptop / Điện thoại
    if (src.toUpperCase() === "WEBCAM" && navigator.mediaDevices?.getUserMedia) {
      cam.video.classList.remove("hidden");
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          cam.video.srcObject = stream;
          cam.video.play();
          if (!cam.isFetching) {
            cam.isFetching = true;
            fetchYoloData(cam);
          }
        })
        .catch((err) => console.error("Không mở được Webcam:", err));
      return;
    }

    // C. CÁC TRƯỜNG HỢP CÒN LẠI: Phát link video (.mp4 / http stream) người dùng nhập
    cam.video.classList.remove("hidden");
    cam.video.srcObject = null;
    cam.video.src = src || "video_lon.mp4";
    cam.video.loop = true;
    cam.video.muted = true;

    cam.video.onloadeddata = () => {
      if ((src || "video_lon.mp4") === "video_lon.mp4") {
        cam.video.currentTime = (index * 3) % (cam.video.duration || 10);
      }
      cam.video.play();

      if (!cam.isFetching) {
        cam.isFetching = true;
        fetchYoloData(cam);
      }
    };
  });
}

// 4. GIAO TIẾP VỚI YOLO
async function fetchYoloData(cam) {
  if (!isMultiAiRunning || !cam.canvas) {
    cam.isFetching = false;
    return;
  }

  const src = (cam.cameraUrl || "").trim();

  // --- TRƯỜNG HỢP 1: LUỒNG EZVIZ HOẶC RTSP TỪ SERVER ---
  if (src === "EZVIZ_STREAM" || src.startsWith("rtsp://")) {
    try {
      const response = await fetch("/api/ai/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barn_id: cam.id,
          image_base64: "EZVIZ_STREAM",
          camera_url: src,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === "success" && result.frame_base64) {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              cam.ctx.clearRect(0, 0, cam.canvas.width, cam.canvas.height);
              cam.ctx.drawImage(img, 0, 0, cam.canvas.width, cam.canvas.height);
              xuLyHanhViVatNuoi(cam, result.data || []);
              resolve();
            };
            img.onerror = resolve;
            img.src = result.frame_base64;
          });
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối Camera Stream:", error);
    }

    setTimeout(() => {
      requestAnimationFrame(() => fetchYoloData(cam));
    }, 200);
    return;
  }

  // --- TRƯỜNG HỢP 2: WEBCAM HOẶC LINK VIDEO TRÌNH DUYỆT ---
  if (!cam.video || cam.video.readyState < 2) {
    setTimeout(() => {
      requestAnimationFrame(() => fetchYoloData(cam));
    }, 200);
    return;
  }

  try {
    cam.ctx.drawImage(cam.video, 0, 0, cam.canvas.width, cam.canvas.height);
    const frameBase64 = cam.canvas.toDataURL("image/jpeg", 0.7);

    const response = await fetch("/api/ai/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barn_id: cam.id,
        image_base64: frameBase64,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      cam.ctx.clearRect(0, 0, cam.canvas.width, cam.canvas.height);

      if (result.status === "success") {
        xuLyHanhViVatNuoi(cam, result.data);
      }
    }
  } catch (error) {
    console.error("Lỗi kết nối AI YOLO:", error);
  }

  setTimeout(() => {
    requestAnimationFrame(() => fetchYoloData(cam));
  }, 200);
}

// 5. Xử lý kết quả đếm và đồng bộ lên KPI Tổng đàn
function xuLyHanhViVatNuoi(cam, yoloData) {
  let currentCount = yoloData.length;
  cam.lastCount = currentCount; // Lưu lại số lượng của chuồng này

  yoloData.forEach((obj) => {
    if (obj.track_id === -1) return;

    cam.ctx.lineWidth = 3;
    cam.ctx.font = "bold 14px Inter";
    cam.ctx.strokeStyle = "#10b981";
    cam.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    cam.ctx.fillStyle = "#10b981";
    cam.ctx.fillText(`ID: ${obj.track_id} (${obj.label})`, obj.x, obj.y - 5);
  });

  // Cập nhật số lượng trên thẻ Camera của chuồng đó
  const countEl = document.getElementById(`count-${cam.id}`);
  if (countEl) {
    countEl.innerHTML = `${currentCount} <span class="text-xs text-slate-500 font-medium">cá thể</span>`;
  }

  // Cập nhật trạng thái sức khỏe
  const statusEl = document.getElementById(`status-${cam.id}`);
  if (statusEl) {
    if (currentCount === 0) {
      statusEl.innerText = "Trống chuồng / Đang quét...";
      statusEl.className = "text-sm font-black text-slate-400 mt-2";
    } else {
      statusEl.innerText = "Tracking: Sức khỏe tốt";
      statusEl.className = "text-sm font-black text-emerald-600 mt-2";
    }
  }

  // TỰ ĐỘNG CỘNG DỒN TỔNG ĐÀN CỦA TẤT CẢ CÁC CHUỒNG ĐẨY LÊN KPI TRANG CHỦ
  const tongDanToanTrai = aiCameras.reduce((sum, item) => sum + (item.lastCount || 0), 0);
  const kpiTongDan = document.getElementById("kpi-tong-dan");
  const kpiTongDanStatus = document.getElementById("kpi-tong-dan-status");

  if (kpiTongDan) {
    kpiTongDan.innerText = `${tongDanToanTrai} cá thể`;
  }
  if (kpiTongDanStatus) {
    kpiTongDanStatus.className = "text-[10px] text-material-teal font-bold mt-2 flex items-center";
    kpiTongDanStatus.innerHTML = `<i class="fa-solid fa-video mr-1.5"></i> Đang đếm trực tiếp từ ${aiCameras.length} Camera AI`;
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

// 6. Render danh sách camera và cho phép chuyển đổi camera
function renderCameraList() {
  const boxCam = document.getElementById("danh-sach-camera");
  if (!boxCam || typeof danhSachChuong === "undefined") return; // Nếu không có boxCam hoặc danhSachChuong chưa được định nghĩa thì thoát hàm

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

// 7. Đồng bộ thông tin tài khoản Admin
async function dongBoTaiKhoanAdmin() {
  const userData = localStorage.getItem("currentUser");

  if (!userData) {
    window.location.href = "index.html";
    return;
  }

  try {
    const raw = JSON.parse(userData);
    const user = raw.data || raw;
    
    const rawName = user.fullName || user.username || "Quản trị viên";
    const rawRole = user.role || "Admin";

    const words = rawName.trim().split(" ");
    const initials =
      words.length > 1
        ? words[0][0] + words[words.length - 1][0]
        : words[0].slice(0, 2);

    document.getElementById("user-fullname").innerText = rawName;
    document.getElementById("user-role").innerText = rawRole.toUpperCase();
    document.getElementById("user-avatar").innerText = initials.toUpperCase();

    document.getElementById("modal-user-fullname").innerText = rawName;
    document.getElementById("modal-user-username").innerText =
      "@" + (user.username || "user");
    document.getElementById("modal-user-avatar").innerText =
      initials.toUpperCase();
    document.getElementById("modal-user-role").innerText =
      `RANK: SYSTEM_${rawRole.toUpperCase()}`;
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

// Đồng bộ thông tin tài khoản Admin khi load trang
dongBoTaiKhoanAdmin();

// Thêm vào script_2.js
function dangXuat() {
    if(confirm("Bạn có chắc chắn muốn thoát khỏi hệ thống?")) {
        // Xóa thông tin đăng nhập trong bộ nhớ
        localStorage.removeItem("currentUser");
        // Chuyển hướng về trang đăng nhập
        window.location.href = "index.html";
    }
}

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
/*const socket = io("http://localhost:3000");

// Lắng nghe sự kiện "cap_nhat_giao_dien" từ server
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

    // ==============================================================
// [CẬP NHẬT LUỒNG THẬT VÀO VẬN HÀNH NHANH]
// ==============================================================
if (data.nhiet_do && data.do_am && typeof danhSachChuong !== "undefined") {
    danhSachChuong.forEach((chuong) => {
        // Tính toán lại độ lệch nhiệt độ/độ ẩm/khí NH3 y hệt như logic ở trên
        const nhietDoChuong = (parseFloat(data.nhiet_do) + chuong.lechNhietDo).toFixed(1);
        const humidChuong = Math.min(100, Math.max(0, parseInt(data.do_am) + (chuong.id === 2 ? 4 : 0)));
        // Lấy NH3 thực tế (nếu có, không thì random tạm theo nhiệt độ để test)
        const nh3ThucTe = data.nh3 ? data.nh3 : (data.nhiet_do > 30 ? 15 : 8); 
        const nh3Chuong = parseInt(nh3ThucTe) + chuong.lechNh3;

        // Truy xuất DOM theo ID (ví dụ: vh-temp-1, vh-temp-2)
        const txtVHTemp = document.getElementById(`vh-temp-${chuong.id}`);
        const txtVHHumid = document.getElementById(`vh-humid-${chuong.id}`);
        const txtVHNh3 = document.getElementById(`vh-nh3-${chuong.id}`);

        // Kiểm tra DOM có tồn tại không rồi mới cập nhật dữ liệu Real-time
        if (txtVHTemp) {
            txtVHTemp.innerText = nhietDoChuong + "°C";
            // Đổi màu cảnh báo nếu quá nóng
            if (nhietDoChuong >= chuong.nguongNong) {
                txtVHTemp.classList.replace("text-material-pink", "text-rose-600");
                txtVHTemp.classList.add("animate-pulse");
            } else {
                txtVHTemp.classList.replace("text-rose-600", "text-material-pink");
                txtVHTemp.classList.remove("animate-pulse");
            }
        }
        
        if (txtVHHumid) {
            txtVHHumid.innerText = humidChuong + "%";
        }
        
        if (txtVHNh3) {
            txtVHNh3.innerText = nh3Chuong + " ppm";
            // Cảnh báo khí độc
            if (nh3Chuong >= chuong.nguongNh3) {
                txtVHNh3.classList.replace("text-material-orange", "text-rose-600");
                txtVHNh3.classList.add("animate-pulse");
            } else {
                txtVHNh3.classList.replace("text-rose-600", "text-material-orange");
                txtVHNh3.classList.remove("animate-pulse");
            }
        }
    });
}
});

// ==========================================
// A. CẬP NHẬT CHỈ SỐ MÔI TRƯỜNG LIÊN TỤC
// ==========================================
socket.on('sensor-data', (data) => {
    /* Format dữ liệu kỳ vọng từ Backend: 
       { nh3: 18.5, fanActive: 3, fanTotal: 4 } 
    */
    
    // 1. Cập nhật con số NH3
    /*const nh3Element = document.getElementById('live-nh3');
    if (nh3Element) nh3Element.innerText = data.nh3.toFixed(1);
    
    // 2. Cập nhật chữ Quạt gió
    const fanElement = document.getElementById('live-fan-count');
    if (fanElement) fanElement.innerText = `${data.fanActive}/${data.fanTotal}`;
    
    // 3. Đổi màu Badge Cảnh báo tự động theo Ngưỡng
    const nh3Badge = document.getElementById('nh3-badge');
    if (nh3Badge) {
        if (data.nh3 >= 20) {
            // Nguy hiểm (Màu Đỏ/Pink)
            nh3Badge.className = 'text-[10px] font-bold bg-material-pink/10 text-material-pink px-2 py-0.5 rounded border border-material-pink/20';
            nh3Badge.innerText = 'NGUY HIỂM';
        } else if (data.nh3 >= 10) {
            // Cảnh báo (Màu Cam)
            nh3Badge.className = 'text-[10px] font-bold bg-material-orange/10 text-material-orange px-2 py-0.5 rounded border border-material-orange/20';
            nh3Badge.innerText = 'CẢNH BÁO NHẸ';
        } else {
            // An toàn (Màu Xanh Teal)
            nh3Badge.className = 'text-[10px] font-bold bg-material-teal/10 text-material-teal px-2 py-0.5 rounded border border-material-teal/20';
            nh3Badge.innerText = 'AN TOÀN';
        }
    }
});


// ==========================================
// B. BẮT SỰ KIỆN CẢNH BÁO / LỖI MỚI NHẤT
// ==========================================
socket.on('system-alert', (alert) => {
    /* Format dữ liệu kỳ vọng từ Backend: 
       { type: 'error', title: 'Quạt hỏng', time: 'Vừa xong', message: 'Mất kết nối...' } 
    */
    
    /*const alertList = document.getElementById('alert-list');
    if (!alertList) return;

    // Phân loại Icon và Màu sắc dựa vào type
    let iconHtml = '';
    if (alert.type === 'error') {
        iconHtml = `<div class="bg-material-pink/10 p-2 rounded-full mt-1"><i class="fa-solid fa-fire text-material-pink text-sm w-4 text-center"></i></div>`;
    } else if (alert.type === 'ai') {
        iconHtml = `<div class="bg-material-purple/10 p-2 rounded-full mt-1"><i class="fa-solid fa-eye text-material-purple text-sm w-4 text-center"></i></div>`;
    } else {
        iconHtml = `<div class="bg-material-teal/10 p-2 rounded-full mt-1"><i class="fa-solid fa-check text-material-teal text-sm w-4 text-center"></i></div>`;
    }

    // Tạo khối HTML (Thẻ <li>) mới
    const newLi = document.createElement('li');
    // Thêm class animate-pulse (nhấp nháy) và viền để làm nổi bật cảnh báo mới
    newLi.className = 'p-4 hover:bg-gray-50 transition-colors flex items-start space-x-4 bg-yellow-50/50 border-l-4 border-material-orange transition-all duration-500';
    newLi.innerHTML = `
        ${iconHtml}
        <div class="flex-1">
            <div class="flex justify-between items-center mb-1">
                <h4 class="text-xs font-bold text-gray-800">${alert.title}</h4>
                <span class="text-[10px] text-gray-400 font-mono">${alert.time}</span>
            </div>
            <p class="text-[11px] text-gray-500 line-clamp-1">${alert.message}</p>
        </div>
    `;

    // Nhét cảnh báo mới lên ĐẦU danh sách
    alertList.prepend(newLi);

    // Chặn độ dài danh sách (Nếu > 4 dòng thì xóa dòng cũ nhất ở dưới cùng)
    if (alertList.children.length > 4) {
        alertList.lastElementChild.remove();
    }
    
    // Tự động tắt hiệu ứng nhấp nháy/nhấn mạnh sau 5 giây
    setTimeout(() => {
        newLi.classList.remove('bg-yellow-50/50', 'border-l-4', 'border-material-orange');
    }, 5000);
});*/

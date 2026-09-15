const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Hỗ trợ đọc dữ liệu JSON

const server = http.createServer(app);
// Khởi tạo kênh truyền thời gian thực, cho phép Web ở Live Server (cổng 5500) truy cập
const io = new Server(server, { cors: { origin: "*" } }); 

// Bắt sự kiện khi Web Dashboard mở lên
io.on('connection', (socket) => {
    console.log('Trình duyệt web vừa kết nối thành công:', socket.id);
});

// API nhận lệnh từ luồng Backend (C# hoặc Python) và phát sóng ngay lập tức lên Web
app.post('/api/broadcast', (req, res) => {
    const data = req.body;
    io.emit('cap_nhat_giao_dien', data); // Bắn luồng dữ liệu thẳng lên trình duyệt
    res.status(200).send({ message: "Đã phát sóng dữ liệu thành công!" });
});

server.listen(3000, () => {
    console.log('Node.js Real-time Gateway đang chạy tại cổng 3000');
});
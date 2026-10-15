using DACN_API.Data;
using DACN_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Net.Http;

namespace DACN_API.Controllers
{
    [ApiController]
    public class IoTController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IoTController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("api/iot/data")]
        public async Task<IActionResult> ReceiveSensorData([FromBody] SensorPayload payload)
        {
            var metric = new SensorMetric
            {
                BarnId = payload.BarnId,
                Temperature = payload.Temperature,
                Humidity = payload.Humidity,
                Nh3Level = payload.Nh3Level,
                RecordedAt = DateTime.Now
            };

            _context.SensorMetrics.Add(metric);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Data saved successfully!" });
        }

        [HttpGet("ai-predict")] 
        public async Task<IActionResult> GetAIPrediction()
        {
            // 1. Lấy dữ liệu cảm biến mới nhất từ cơ sở dữ liệu
            var latestData = await _context.SensorMetrics
                .OrderByDescending(s => s.RecordedAt)
                .FirstOrDefaultAsync();

            if (latestData == null)
            {
                return NotFound(new { message = "Chưa có dữ liệu cảm biến trong cơ sở dữ liệu." });
            }

            // Lấy thông số thực tế đóng gói lại
            var currentData = new
            {
                nhiet_do = latestData.Temperature, 
                do_am = latestData.Humidity,
                gio = DateTime.Now.Hour 
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(currentData), Encoding.UTF8, "application/json");

            // 2. Bắn sang cổng 5000 của Python để AI xử lý
            using (var client = new HttpClient())
            {
                try
                {
                    var response = await client.PostAsync("http://localhost:5000/api/predict-weather", jsonContent);
                    var result = await response.Content.ReadAsStringAsync();

                    // 3. Trả về giao diện Web
                    return Content(result, "application/json");
                }
                catch (HttpRequestException)
                {
                    return StatusCode(500, new { message = "Máy chủ AI Python chưa được bật hoặc mất kết nối!" });
                }
            }
        }

        [HttpGet("api/sensors/latest")]
        public async Task<IActionResult> GetLatestSensorData()
        {
            // 1. Lấy dữ liệu cảm biến mới nhất từ cơ sở dữ liệu
            var latestData = await _context.SensorMetrics
                .OrderByDescending(s => s.RecordedAt)
                .FirstOrDefaultAsync();

            if (latestData == null)
            {
                // Nếu không có dữ liệu, trả về dữ liệu mặc định
                return Ok(new { temperature = 27.5, humidity = 65, nh3 = 10 });
            }

            return Ok(new
            {
                temperature = latestData.Temperature,
                humidity = latestData.Humidity,
                nh3 = latestData.Nh3Level
            });
        }
    }

    public class SensorPayload
    {
        public int BarnId { get; set; }
        public float Temperature { get; set; }
        public float Humidity { get; set; }
        public float Nh3Level { get; set; }
    }
}
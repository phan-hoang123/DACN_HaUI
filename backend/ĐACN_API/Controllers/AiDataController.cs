using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DACN_API.Data; 
using DACN_API.Models;

namespace DACN_API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AiDataController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AiDataController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetAiHistory()
        {
            var data = await _context.AiVisionLogs
                .OrderBy(a => a.RecordedAt)
                .Select(a => new {
                    chuong_id = a.BarnId,
                    total_count = a.TotalCount,
                    date_label = a.DateLabel
                })
                .ToListAsync();

            if (!data.Any())
            {
                return NotFound(new { message = "Chưa có dữ liệu AI Camera" });
            }

            return Ok(data);
        }
    }
}
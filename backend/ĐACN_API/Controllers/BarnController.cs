using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DACN_API.Data;
using DACN_API.Models;

namespace DACN_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BarnController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BarnController(AppDbContext context)
        {
            _context = context;
        }

        // Lấy danh sách tất cả các chuồng
        [HttpGet]
        public async Task<IActionResult> GetBarns()
        {
            var barns = await _context.Barns.ToListAsync();
            return Ok(barns);
        }

        // Tạo một chuồng mới
        [HttpPost]
        public async Task<IActionResult> AddBarn(Barn barn)
        {
            _context.Barns.Add(barn);
            await _context.SaveChangesAsync();
            return Ok(barn);
        }

        // Cập nhật thông tin của một chuồng
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBarn(int id, Barn barn)
        {
            if (id != barn.Id) return BadRequest();

            _context.Entry(barn).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(barn);
        }

        // Xóa một chuồng
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBarn(int id)
        {
            var barn = await _context.Barns.FindAsync(id);
            if (barn == null) return NotFound();

            _context.Barns.Remove(barn);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
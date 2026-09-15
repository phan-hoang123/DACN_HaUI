using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DACN_API.Data;

namespace DACN_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.Password == request.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu!" });
            }

            return Ok(new
            {
                message = "Đăng nhập thành công",
                data = new
                {
                    fullName = user.FullName,
                    role = user.Role,
                    username = user.Username
                }
            });
        }
    }
    public class LoginRequest
    {
        public string ?Username { get; set; }
        public string ?Password { get; set; }
    }
}
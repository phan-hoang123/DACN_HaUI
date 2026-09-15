using Microsoft.EntityFrameworkCore;
using DACN_API.Data;
using DACN_API.Models;

namespace DACN_API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Barn> Barns { get; set; }
        public DbSet<AiVisionLog> AiVisionLogs { get; set; }
        public DbSet<Device> Devices { get; set; }
        public DbSet<SensorMetric> SensorMetrics { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SystemLog> SystemLogs { get; set; } 
    }
}
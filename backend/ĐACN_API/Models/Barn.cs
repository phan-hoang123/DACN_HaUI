using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("barns")]
    public class Barn
    {
        [Key]
        public int Id { get; set; }
        public string? Prefix { get; set; }
        public string? Loai { get; set; }
        public double LechNhietDo { get; set; }
        public double LechNh3 { get; set; }
        public double NguongNong { get; set; }
        public double NguongNh3 { get; set; }

        public ICollection<SensorMetric> ?SensorMetrics { get; set; }
        public ICollection<AiVisionLog> ?AiVisionLogs { get; set; }
    }
}
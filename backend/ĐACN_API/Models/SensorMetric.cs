using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("sensor_metrics")]
    public class SensorMetric
    {
        [Key]
        public long Id { get; set; } 
        [ForeignKey("Barn")]
        public int BarnId { get; set; }
        public Barn ?Barn { get; set; } 

        public float Temperature { get; set; }
        public float Humidity { get; set; }
        public float Nh3Level { get; set; }

        [Required] 
        public DateTime RecordedAt { get; set; } = DateTime.Now;
    }
}
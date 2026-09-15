using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("ai_vision_logs")]
    public class AiVisionLog
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey("Barn")]
        public int BarnId { get; set; }
        public Barn ?Barn { get; set; }

        public int TotalCount { get; set; }
        public int SickCount { get; set; }

        [MaxLength(20)]
        public string ?DateLabel { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.Now;
    }
}
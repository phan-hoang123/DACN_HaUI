using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("system_logs")]
    public class SystemLog
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(20)]
        public string ?LogType { get; set; } 
        public string ?Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
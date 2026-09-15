using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("devices")]
    public class Device
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Barn")]
        public int BarnId { get; set; }
        public Barn ?Barn { get; set; } 

        [MaxLength(50)]
        public string ?DeviceName { get; set; }
        [MaxLength(20)]
        public string ?DeviceType { get; set; } 

        public bool IsActive { get; set; } = false; 
    }
}
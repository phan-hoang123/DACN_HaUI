using DACN_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DACN_API.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string ?Username { get; set; }
        [Required, MaxLength(255)]
        public string ?Password { get; set; }
        [MaxLength(100)]
        public string ?FullName { get; set; }
        [MaxLength(20)]
        public string ?Role { get; set; }
    }
}
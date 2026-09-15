using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DACN_API.Migrations
{
    /// <inheritdoc />
    public partial class ThemCotDateLabel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DateLabel",
                table: "ai_vision_logs",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateLabel",
                table: "ai_vision_logs");
        }
    }
}

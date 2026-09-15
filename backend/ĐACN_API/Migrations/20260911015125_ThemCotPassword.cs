using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DACN_API.Migrations
{
    /// <inheritdoc />
    public partial class ThemCotPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "users",
                newName: "Password");

            migrationBuilder.AlterColumn<string>(
                name: "DateLabel",
                table: "ai_vision_logs",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Password",
                table: "users",
                newName: "PasswordHash");

            migrationBuilder.UpdateData(
                table: "ai_vision_logs",
                keyColumn: "DateLabel",
                keyValue: null,
                column: "DateLabel",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "DateLabel",
                table: "ai_vision_logs",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}

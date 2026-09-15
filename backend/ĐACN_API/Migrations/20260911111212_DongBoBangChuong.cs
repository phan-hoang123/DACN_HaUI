using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DACN_API.Migrations
{
    /// <inheritdoc />
    public partial class DongBoBangChuong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnimalType",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "BarnCode",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "Nh3Threshold",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "TempThreshold",
                table: "barns");

            migrationBuilder.AddColumn<double>(
                name: "LechNh3",
                table: "barns",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "LechNhietDo",
                table: "barns",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Loai",
                table: "barns",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<double>(
                name: "NguongNh3",
                table: "barns",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "NguongNong",
                table: "barns",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Prefix",
                table: "barns",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LechNh3",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "LechNhietDo",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "Loai",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "NguongNh3",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "NguongNong",
                table: "barns");

            migrationBuilder.DropColumn(
                name: "Prefix",
                table: "barns");

            migrationBuilder.AddColumn<string>(
                name: "AnimalType",
                table: "barns",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BarnCode",
                table: "barns",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<float>(
                name: "Nh3Threshold",
                table: "barns",
                type: "float",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "TempThreshold",
                table: "barns",
                type: "float",
                nullable: false,
                defaultValue: 0f);
        }
    }
}

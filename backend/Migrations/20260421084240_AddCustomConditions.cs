using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GRU_APP.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomConditions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "CustomConditions",
                table: "Services",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomConditions",
                table: "Services");
        }
    }
}

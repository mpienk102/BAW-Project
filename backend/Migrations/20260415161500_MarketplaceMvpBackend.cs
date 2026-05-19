using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GRU_APP.Backend.Migrations
{
    /// <inheritdoc />
    public partial class MarketplaceMvpBackend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BasePrice",
                table: "Services",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Services",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LocationLabel",
                table: "Services",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PriceType",
                table: "Services",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RadiusKm",
                table: "Services",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ResponseTimeMinutes",
                table: "Services",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ServiceArea",
                table: "Services",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Turnaround",
                table: "Services",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayLabel = table.Column<string>(type: "text", nullable: false),
                    TimeWindow = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvailabilitySlots_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Inquiries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Budget = table.Column<string>(type: "text", nullable: false),
                    PreferredDate = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inquiries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Inquiries_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Inquiries_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InquiryMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InquiryId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderRole = table.Column<string>(type: "text", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InquiryMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InquiryMessages_Inquiries_InquiryId",
                        column: x => x.InquiryId,
                        principalTable: "Inquiries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Remonty");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Sprzatanie");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Elektryka");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "Ogrod");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "IT");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6,
                column: "Name",
                value: "Hydraulika");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7,
                column: "Name",
                value: "Transport");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySlots_ServiceId",
                table: "AvailabilitySlots",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_ClientId",
                table: "Inquiries",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_ServiceId",
                table: "Inquiries",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_InquiryMessages_InquiryId",
                table: "InquiryMessages",
                column: "InquiryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvailabilitySlots");

            migrationBuilder.DropTable(
                name: "InquiryMessages");

            migrationBuilder.DropTable(
                name: "Inquiries");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BasePrice",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "LocationLabel",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "PriceType",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "RadiusKm",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ResponseTimeMinutes",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ServiceArea",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Turnaround",
                table: "Services");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Plumbing");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Electrical");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Cleaning");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "IT & Tech Support");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "Graphic Design");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6,
                column: "Name",
                value: "Tutoring");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7,
                column: "Name",
                value: "Photography");
        }
    }
}

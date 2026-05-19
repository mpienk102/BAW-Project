using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GRU_APP.Backend.Models;
using GRU_APP.Backend.Data;
using System.Security.Claims;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReservationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> BookService([FromBody] BookServiceRequest req)
    {
        var clientId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services.FindAsync(req.ServiceId);

        if (service == null) return NotFound("Service not found.");
        if (!service.RequiresReservation) return BadRequest("This service does not accept reservations.");
        if (service.ProviderId == clientId) return BadRequest("You cannot reserve your own service.");

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            ServiceId = req.ServiceId,
            ClientId = clientId,
            AppointmentDate = req.AppointmentDate,
            ClientMessage = req.ClientMessage,
            Status = "Pending"
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Service booked successfully." });
    }

    [HttpGet("client")]
    public async Task<IActionResult> GetClientReservations()
    {
        var clientId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var reservations = await _context.Reservations
            .Include(r => r.Service)
            .ThenInclude(s => s.Provider)
            .Where(r => r.ClientId == clientId)
            .OrderByDescending(r => r.AppointmentDate)
            .Select(r => new {
                r.Id, r.AppointmentDate, r.Status, r.ClientMessage,
                Service = new { r.Service.Title, Provider = $"{r.Service.Provider.FirstName} {r.Service.Provider.LastName}" }
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpGet("provider")]
    public async Task<IActionResult> GetProviderReservations()
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var reservations = await _context.Reservations
            .Include(r => r.Service)
            .Include(r => r.Client)
            .Where(r => r.Service.ProviderId == providerId)
            .OrderByDescending(r => r.AppointmentDate)
            .Select(r => new {
                r.Id, r.AppointmentDate, r.Status, r.ClientMessage,
                Service = new { r.Service.Id, r.Service.Title },
                Client = new { r.Client.FirstName, r.Client.LastName, r.Client.Email }
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateReservationStatus(Guid id, [FromBody] UpdateStatusRequest req)
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reservation = await _context.Reservations
            .Include(r => r.Service)
            .FirstOrDefaultAsync(r => r.Id == id && r.Service.ProviderId == providerId);

        if (reservation == null) return NotFound("Reservation not found or unauthorized.");
        if (req.Status != "Accepted" && req.Status != "Rejected") return BadRequest("Invalid status.");

        reservation.Status = req.Status;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Reservation status updated to {req.Status}." });
    }
}

public class BookServiceRequest
{
    public Guid ServiceId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string? ClientMessage { get; set; }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = null!;
}

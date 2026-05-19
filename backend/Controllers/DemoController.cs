using GRU_APP.Backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemoController : ControllerBase
{
    private readonly AppDbContext _context;

    public DemoController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("accounts")]
    public IActionResult GetAccounts()
    {
        return Ok(new[]
        {
            new { label = "Wykonawca demo", email = DemoDataSeeder.ProviderEmail, password = DemoDataSeeder.DemoPassword },
            new { label = "Klient demo",    email = DemoDataSeeder.ClientEmail,   password = DemoDataSeeder.DemoPassword },
            new { label = "Admin demo",     email = DemoDataSeeder.AdminEmail,    password = DemoDataSeeder.DemoPassword }
        });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetDemo()
    {
        _context.InquiryMessages.RemoveRange(_context.InquiryMessages);
        _context.Inquiries.RemoveRange(_context.Inquiries);
        _context.Reviews.RemoveRange(_context.Reviews);
        _context.AvailabilitySlots.RemoveRange(_context.AvailabilitySlots);
        _context.Photos.RemoveRange(_context.Photos);
        _context.Services.RemoveRange(_context.Services);
        await _context.SaveChangesAsync();

        await DemoDataSeeder.SeedAsync(_context);
        return Ok(new { message = "Demo data reset." });
    }
}

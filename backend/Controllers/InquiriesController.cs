using System.Security.Claims;
using GRU_APP.Backend.Data;
using GRU_APP.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InquiriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InquiriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateInquiry([FromBody] CreateInquiryRequest req)
    {
        var clientId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services.Include(s => s.Provider).FirstOrDefaultAsync(s => s.Id == req.ServiceId && s.IsActive);

        if (service == null)
            return NotFound(new { message = "Service not found." });

        var inquiry = new Inquiry
        {
            Id = Guid.NewGuid(),
            ServiceId = req.ServiceId,
            ClientId = clientId,
            Budget = req.Budget,
            PreferredDate = req.PreferredDate,
            Summary = req.Summary,
            Location = req.Location,
            Status = "Nowe",
            CreatedAt = DateTime.UtcNow,
            Messages = new List<InquiryMessage>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    SenderRole = "client",
                    Text = req.Summary,
                    SentAt = DateTime.UtcNow
                }
            }
        };

        _context.Inquiries.Add(inquiry);
        await _context.SaveChangesAsync();

        return Created($"/api/inquiries/{inquiry.Id}", new { inquiryId = inquiry.Id, message = "Inquiry created." });
    }

    [HttpGet("client")]
    public async Task<IActionResult> GetClientInquiries()
    {
        var clientId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inquiries = await BuildInquiryQuery()
            .Where(i => i.ClientId == clientId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(inquiries.Select(MapInquiry));
    }

    [HttpGet("provider")]
    public async Task<IActionResult> GetProviderInquiries()
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inquiries = await BuildInquiryQuery()
            .Where(i => i.Service.ProviderId == providerId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(inquiries.Select(MapInquiry));
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, [FromBody] AddInquiryMessageRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inquiry = await BuildInquiryQuery().FirstOrDefaultAsync(i => i.Id == id);

        if (inquiry == null)
            return NotFound(new { message = "Inquiry not found." });

        var isClient = inquiry.ClientId == userId;
        var isProvider = inquiry.Service.ProviderId == userId;
        if (!isClient && !isProvider)
            return Forbid();

        var message = new InquiryMessage
        {
            Id = Guid.NewGuid(),
            InquiryId = inquiry.Id,
            SenderRole = isProvider ? "provider" : "client",
            Text = req.Text,
            SentAt = DateTime.UtcNow
        };

        inquiry.Status = "W trakcie";
        _context.InquiryMessages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message sent." });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInquiryStatusRequest req)
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inquiry = await _context.Inquiries
            .Include(i => i.Service)
            .FirstOrDefaultAsync(i => i.Id == id && i.Service.ProviderId == providerId);

        if (inquiry == null)
            return NotFound(new { message = "Inquiry not found or unauthorized." });

        var allowed = new[] { "Nowe", "W trakcie", "Umowione", "Zamkniete" };
        if (!allowed.Contains(req.Status))
            return BadRequest(new { message = "Invalid status." });

        inquiry.Status = req.Status;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Status updated." });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inquiry = await BuildInquiryQuery().FirstOrDefaultAsync(i => i.Id == id);

        if (inquiry == null)
            return NotFound(new { message = "Inquiry not found." });

        var isClient = inquiry.ClientId == userId;
        var isProvider = inquiry.Service.ProviderId == userId;
        
        if (!isClient && !isProvider)
            return Forbid();

        var oppositeRole = isClient ? "provider" : "client";
        var unreadMessages = inquiry.Messages.Where(m => m.SenderRole == oppositeRole && !m.IsRead).ToList();
        
        if (unreadMessages.Any())
        {
            foreach (var msg in unreadMessages)
                msg.IsRead = true;
                
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Messages marked as read." });
    }

    private IQueryable<Inquiry> BuildInquiryQuery() =>
        _context.Inquiries
            .Include(i => i.Client)
            .Include(i => i.Service)
                .ThenInclude(s => s.Provider)
            .Include(i => i.Messages.OrderBy(m => m.SentAt));

    private static object MapInquiry(Inquiry inquiry) => new
    {
        inquiry.Id,
        inquiry.ServiceId,
        ServiceTitle = inquiry.Service.Title,
        inquiry.Status,
        inquiry.Budget,
        inquiry.PreferredDate,
        CustomerName = $"{inquiry.Client.FirstName} {inquiry.Client.LastName}",
        inquiry.Summary,
        inquiry.Location,
        inquiry.CreatedAt,
        Messages = inquiry.Messages.Select(m => new
        {
            m.Id,
            m.SenderRole,
            m.Text,
            m.IsRead,
            m.SentAt
        })
    };
}

public class CreateInquiryRequest
{
    public Guid ServiceId { get; set; }
    public string Budget { get; set; } = null!;
    public string PreferredDate { get; set; } = null!;
    public string Summary { get; set; } = null!;
    public string Location { get; set; } = null!;
}

public class AddInquiryMessageRequest
{
    public string Text { get; set; } = null!;
}

public class UpdateInquiryStatusRequest
{
    public string Status { get; set; } = null!;
}

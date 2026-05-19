using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GRU_APP.Backend.Models;
using GRU_APP.Backend.Data;
using System.Security.Claims;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/services/{serviceId}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> PostReview(Guid serviceId, [FromBody] CreateReviewRequest req)
    {
        var authorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services.FindAsync(serviceId);

        if (service == null) return NotFound("Service not found.");
        if (req.Rating < 1 || req.Rating > 5) return BadRequest("Rating must be between 1 and 5.");

        var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.ServiceId == serviceId && r.AuthorId == authorId);
        if (alreadyReviewed) return Conflict("You have already reviewed this service.");

        // Authorization: only allow reviews from clients who actually interacted with the service
        // (accepted reservation OR at least one inquiry for this service).
        var hasAcceptedReservation = await _context.Reservations.AnyAsync(r =>
            r.ServiceId == serviceId &&
            r.ClientId == authorId &&
            r.Status == "Accepted");

        var hasInquiry = await _context.Inquiries.AnyAsync(i =>
            i.ServiceId == serviceId &&
            i.ClientId == authorId);

        if (!hasAcceptedReservation && !hasInquiry)
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Not allowed to review this service." });

        var review = new Review
        {
            Id = Guid.NewGuid(),
            ServiceId = serviceId,
            AuthorId = authorId,
            Rating = req.Rating,
            Comment = req.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Review added.", id = review.Id });
    }
}

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string Comment { get; set; } = null!;
}

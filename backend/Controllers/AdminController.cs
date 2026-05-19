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
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    // ── Guard helper ──────────────────────────────────────────────
    private bool IsAdmin() =>
        User.Claims.Any(c => c.Type == ClaimTypes.Role && c.Value == "Admin");

    // ── Stats ─────────────────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!IsAdmin()) return Forbid();

        return Ok(new
        {
            users    = await _context.Users.CountAsync(),
            services = await _context.Services.CountAsync(),
            reviews  = await _context.Reviews.CountAsync(),
            inquiries = await _context.Inquiries.CountAsync(),
            reservations = await _context.Reservations.CountAsync()
        });
    }

    // ── Users ─────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!IsAdmin()) return Forbid();

        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.CompanyName,
                u.Role,
                u.IsEmailVerified,
                u.IsBlocked,
                u.CreatedAt,
                ServicesCount = u.Services.Count
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId)
            return BadRequest(new { message = "Nie mozna usunac wlasnego konta." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (user.Role == "Admin")
            return BadRequest(new { message = "Nie mozna usunac konta administratora." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Uzytkownik usuniety." });
    }

    [HttpPatch("users/{id:guid}/block")]
    public async Task<IActionResult> ToggleBlock(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId)
            return BadRequest(new { message = "Nie mozna zablokowac wlasnego konta." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (user.Role == "Admin")
            return BadRequest(new { message = "Nie mozna zablokowac konta administratora." });

        user.IsBlocked = !user.IsBlocked;
        await _context.SaveChangesAsync();
        return Ok(new { isBlocked = user.IsBlocked });
    }

    // ── Services ──────────────────────────────────────────────────
    [HttpGet("services")]
    public async Task<IActionResult> GetServices()
    {
        if (!IsAdmin()) return Forbid();

        var services = await _context.Services
            .Include(s => s.Provider)
            .Include(s => s.Category)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.Title,
                s.IsActive,
                s.CreatedAt,
                Category = s.Category.Name,
                Provider = $"{s.Provider.FirstName} {s.Provider.LastName}",
                ProviderEmail = s.Provider.Email,
                ReviewsCount = s.Reviews.Count
            })
            .ToListAsync();

        return Ok(services);
    }

    [HttpDelete("services/{id:guid}")]
    public async Task<IActionResult> DeleteService(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var service = await _context.Services.FindAsync(id);
        if (service == null) return NotFound();

        _context.Services.Remove(service);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usluga usunieta." });
    }

    // ── Reviews ───────────────────────────────────────────────────
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews()
    {
        if (!IsAdmin()) return Forbid();

        var reviews = await _context.Reviews
            .Include(r => r.Author)
            .Include(r => r.Service)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                Service = r.Service.Title,
                Author = $"{r.Author.FirstName} {r.Author.LastName}",
                AuthorEmail = r.Author.Email
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpDelete("reviews/{id:guid}")]
    public async Task<IActionResult> DeleteReview(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Recenzja usunieta." });
    }
}

using System.Security.Claims;
using GRU_APP.Backend.Data;
using GRU_APP.Backend.Models;
using GRU_APP.Backend.Validation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetServices(
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] string? city,
        [FromQuery] int? radiusKm,
        [FromQuery] string? sortBy)
    {
        var query = _context.Services
            .Include(s => s.Category)
            .Include(s => s.Photos)
            .Include(s => s.Provider)
            .Include(s => s.Reviews)
                .ThenInclude(r => r.Author)
            .Include(s => s.AvailabilitySlots)
            .Where(s => s.IsActive)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(s => s.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var phrase = search.Trim().ToLower();
            query = query.Where(s =>
                s.Title.ToLower().Contains(phrase) ||
                s.Description.ToLower().Contains(phrase) ||
                s.Category.Name.ToLower().Contains(phrase));
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityQuery = city.Trim().ToLower();
            query = query.Where(s =>
                s.LocationLabel.ToLower().Contains(cityQuery) ||
                s.ServiceArea.ToLower().Contains(cityQuery));
        }

        if (radiusKm.HasValue)
            query = query.Where(s => s.RadiusKm >= radiusKm.Value - 5);

        var services = await query.ToListAsync();

        services = sortBy?.ToLower() switch
        {
            "price" => services.OrderBy(s => s.BasePrice).ToList(),
            "speed" => services.OrderBy(s => s.ResponseTimeMinutes).ToList(),
            _ => services.OrderByDescending(GetAverageRating).ThenBy(s => s.BasePrice).ToList()
        };

        return Ok(services.Select(MapServiceCard));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetServiceDetails(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Provider)
            .Include(s => s.Photos.OrderBy(p => p.SortOrder))
            .Include(s => s.Reviews.OrderByDescending(r => r.CreatedAt))
                .ThenInclude(r => r.Author)
            .Include(s => s.AvailabilitySlots)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

        if (service == null)
            return NotFound(new { message = "Service not found." });

        return Ok(MapServiceDetails(service));
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyServices()
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var services = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Photos)
            .Include(s => s.Reviews)
                .ThenInclude(r => r.Author)
            .Include(s => s.AvailabilitySlots)
            .Where(s => s.ProviderId == providerId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(services.Select(MapServiceCard));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest req)
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var category = await ResolveCategory(req.CategoryId, req.CategoryName);

        if (category == null)
            return BadRequest(new { message = "Category is required." });

        var service = new Service
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            CategoryId = category.Id,
            Title = req.Title,
            Description = req.Description,
            BasePrice = req.BasePrice,
            PriceType = string.IsNullOrWhiteSpace(req.PriceType) ? "fixed" : req.PriceType.Trim().ToLower(),
            LocationLabel = req.LocationLabel,
            ServiceArea = string.Join(", ", req.Cities.Distinct()),
            RadiusKm = req.RadiusKm,
            Turnaround = string.IsNullOrWhiteSpace(req.Turnaround) ? "Na zapytanie" : req.Turnaround.Trim(),
            ResponseTimeMinutes = req.ResponseTimeMinutes <= 0 ? 60 : req.ResponseTimeMinutes,
            RequiresReservation = req.RequiresReservation,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            AvailabilitySlots = req.Availability
                .Select(a => new AvailabilitySlot
                {
                    Id = Guid.NewGuid(),
                    DayLabel = a.DayLabel,
                    TimeWindow = a.TimeWindow,
                    Status = string.IsNullOrWhiteSpace(a.Status) ? "available" : a.Status.Trim().ToLower()
                }).ToList(),
            CustomConditions = req.CustomConditions ?? new List<string>(),
            Photos = req.PhotoUrls
                .Select((url, index) => new Photo
                {
                    Id = Guid.NewGuid(),
                    PhotoUrl = url,
                    SortOrder = index
                }).ToList()
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return Created($"/api/services/{service.Id}", new { serviceId = service.Id, message = "Service created." });
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateService(Guid id, [FromBody] UpdateServiceRequest req)
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services
            .Include(s => s.AvailabilitySlots)
            .Include(s => s.Photos)
            .FirstOrDefaultAsync(s => s.Id == id && s.ProviderId == providerId);

        if (service == null)
            return NotFound(new { message = "Service not found or unauthorized." });

        var category = await ResolveCategory(req.CategoryId, req.CategoryName);
        if (category == null)
            return BadRequest(new { message = "Category is required." });

        service.CategoryId = category.Id;
        service.Title = req.Title;
        service.Description = req.Description;
        service.BasePrice = req.BasePrice;
        service.PriceType = string.IsNullOrWhiteSpace(req.PriceType) ? service.PriceType : req.PriceType.Trim().ToLower();
        service.LocationLabel = req.LocationLabel;
        service.ServiceArea = string.Join(", ", req.Cities.Distinct());
        service.RadiusKm = req.RadiusKm;
        service.Turnaround = string.IsNullOrWhiteSpace(req.Turnaround) ? service.Turnaround : req.Turnaround.Trim();
        service.ResponseTimeMinutes = req.ResponseTimeMinutes <= 0 ? service.ResponseTimeMinutes : req.ResponseTimeMinutes;
        service.RequiresReservation = req.RequiresReservation;
        service.IsActive = req.IsActive;
        service.CustomConditions = req.CustomConditions ?? new List<string>();

        _context.AvailabilitySlots.RemoveRange(service.AvailabilitySlots);
        var newSlots = req.Availability.Select(a => new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            ServiceId = service.Id,
            DayLabel = a.DayLabel,
            TimeWindow = a.TimeWindow,
            Status = string.IsNullOrWhiteSpace(a.Status) ? "available" : a.Status.Trim().ToLower()
        }).ToList();
        _context.AvailabilitySlots.AddRange(newSlots);

        if (req.PhotoUrls.Count > 0)
        {
            _context.Photos.RemoveRange(service.Photos);
            var newPhotos = req.PhotoUrls.Select((url, index) => new Photo
            {
                Id = Guid.NewGuid(),
                ServiceId = service.Id,
                PhotoUrl = url,
                SortOrder = index
            }).ToList();
            _context.Photos.AddRange(newPhotos);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Service updated." });
    }

    [HttpPost("{id:guid}/photos")]
    [Authorize]
    public async Task<IActionResult> UploadPhoto(Guid id, [FromBody] PhotoRequest req)
    {
        var providerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services
            .Include(s => s.Photos)
            .FirstOrDefaultAsync(s => s.Id == id && s.ProviderId == providerId);

        if (service == null)
            return NotFound(new { message = "Service not found or unauthorized." });

        var photo = new Photo
        {
            Id = Guid.NewGuid(),
            ServiceId = id,
            PhotoUrl = req.PhotoUrl,
            SortOrder = service.Photos.Count
        };

        _context.Photos.Add(photo);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Photo uploaded.", photo.Id, photo.PhotoUrl });
    }

    private async Task<Category?> ResolveCategory(int? categoryId, string? categoryName)
    {
        if (categoryId.HasValue)
            return await _context.Categories.FirstOrDefaultAsync(c => c.Id == categoryId.Value);

        if (string.IsNullOrWhiteSpace(categoryName))
            return null;

        var normalized = categoryName.Trim();
        var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == normalized.ToLower());
        if (existing != null)
            return existing;

        var nextId = await _context.Categories.AnyAsync() ? await _context.Categories.MaxAsync(c => c.Id) + 1 : 1;
        var category = new Category { Id = nextId, Name = normalized };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    private static decimal GetAverageRating(Service service) =>
        service.Reviews.Count == 0 ? 0 : Math.Round(service.Reviews.Average(r => (decimal)r.Rating), 1);

    private static object MapServiceCard(Service service)
    {
        var cities = service.ServiceArea
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new
        {
            service.Id,
            service.Title,
            service.Description,
            Category = new { 
                        service.CategoryId, 
                        Name = service.Category?.Name ?? "Brak kategorii" 
                    },
            Price = service.BasePrice,
            service.PriceType,
            service.LocationLabel,
            Cities = cities,
            service.RadiusKm,
            service.Turnaround,
            ResponseTime = $"< {Math.Max(service.ResponseTimeMinutes, 1)} min",
            Rating = GetAverageRating(service),
            ReviewCount = service.Reviews.Count,
            CompletedJobs = service.Reviews.Count,
            Reviews = service.Reviews.Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                Author = r.Author != null ? $"{r.Author.FirstName} {r.Author.LastName}" : "Anonimowy użytkownik"
            }),
            Provider = new
                    {
                        Name = service.Provider != null 
                            ? $"{service.Provider.FirstName} {service.Provider.LastName}" 
                            : "Nieznany dostawca",
                        Company = service.Provider?.CompanyName ?? "Brak nazwy firmy",
                        Bio = service.Provider?.Bio,
                        VerifiedLabel = $"Odpowiada srednio w {Math.Max(service.ResponseTimeMinutes, 1)} min"
                    },
            PhotoUrls = service.Photos.OrderBy(p => p.SortOrder).Select(p => p.PhotoUrl),
            Availability = service.AvailabilitySlots.Select(a => new { a.Id, a.DayLabel, a.TimeWindow, a.Status }),
            CustomConditions = service.CustomConditions ?? new List<string>()
        };
    }

    private static object MapServiceDetails(Service service)
    {
        var card = MapServiceCard(service);
        var cities = service.ServiceArea
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new
        {
            service.Id,
            service.Title,
            service.Description,
            Category = new { service.CategoryId, service.Category.Name },
            Price = service.BasePrice,
            service.PriceType,
            service.LocationLabel,
            Cities = cities,
            service.RadiusKm,
            service.Turnaround,
            ResponseTimeMinutes = service.ResponseTimeMinutes,
            service.RequiresReservation,
            Rating = GetAverageRating(service),
            ReviewCount = service.Reviews.Count,
            CompletedJobs = service.Reviews.Count,
            Provider = new
            {
                service.Provider.Id,
                service.Provider.FirstName,
                service.Provider.LastName,
                service.Provider.Email,
                service.Provider.CompanyName,
                service.Provider.Bio,
                service.Provider.PhoneNumber,
                VerifiedLabel = $"Odpowiada srednio w {Math.Max(service.ResponseTimeMinutes, 1)} min"
            },
            Portfolio = service.Photos.OrderBy(p => p.SortOrder).Select(p => new { p.Id, p.PhotoUrl, p.SortOrder }),
            Availability = service.AvailabilitySlots.Select(a => new { a.Id, a.DayLabel, a.TimeWindow, a.Status }),
            Reviews = service.Reviews.Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                // BEZPIECZNE MAPOWANIE AUTORA:
                Author = r.Author != null ? $"{r.Author.FirstName} {r.Author.LastName}" : "Anonimowy użytkownik"
            }),
            CustomConditions = service.CustomConditions ?? new List<string>(),
            Summary = card
        };
    }
}

public class CreateServiceRequest
{
    public int? CategoryId { get; set; }

    [MaxLength(80)]
    [NoHtml]
    public string? CategoryName { get; set; }

    [Required]
    [MaxLength(120)]
    [NoHtml]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(4000)]
    [NoHtml]
    public string Description { get; set; } = null!;
    public decimal BasePrice { get; set; }

    [MaxLength(32)]
    [NoHtml]
    [RegularExpression("^(?i:(fixed|hourly|from|per_item))$", ErrorMessage = "Invalid priceType.")]
    public string PriceType { get; set; } = "fixed";
    public string LocationLabel { get; set; } = null!;
    public List<string> Cities { get; set; } = new();
    public int RadiusKm { get; set; }
    public string? Turnaround { get; set; }
    public int ResponseTimeMinutes { get; set; }
    public bool RequiresReservation { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
    public List<AvailabilitySlotRequest> Availability { get; set; } = new();
    public List<string> CustomConditions { get; set; } = new();
}

public class UpdateServiceRequest : CreateServiceRequest
{
    public bool IsActive { get; set; } = true;
}

public class AvailabilitySlotRequest
{
    public string DayLabel { get; set; } = null!;
    public string TimeWindow { get; set; } = null!;
    public string Status { get; set; } = "available";
}

public class PhotoRequest
{
    public string PhotoUrl { get; set; } = null!;
}

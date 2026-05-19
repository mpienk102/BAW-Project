using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GRU_APP.Backend.Data;
using GRU_APP.Backend.Models;
using GRU_APP.Backend.Validation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.RateLimiting;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPerIp")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _context.Users.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Email is already taken." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = req.FirstName,
            LastName = req.LastName,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            CompanyName = req.CompanyName,
            Bio = req.Bio,
            PhoneNumber = req.PhoneNumber,
            IsEmailVerified = true,
            Role = req.Role == "Provider" ? "Provider" : "Client",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration successful." });
    }

    [HttpPost("login")]
    [EnableRateLimiting("AuthPerIp")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsEmailVerified)
            return Unauthorized(new { message = "Email is not verified." });

        if (user.IsBlocked)
            return Unauthorized(new { message = "Twoje konto zostało zablokowane. Skontaktuj się z administracją usługi." });

        return Ok(new
        {
            token = GenerateToken(user),
            user = MapUser(user)
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        if (user.IsBlocked)
            return Unauthorized(new { message = "Twoje konto zostało zablokowane. Skontaktuj się z administracją usługi." });

        return Ok(MapUser(user));
    }

    private string GenerateToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static object MapUser(User user) => new
    {
        user.Id,
        user.FirstName,
        user.LastName,
        user.Email,
        user.CompanyName,
        user.Bio,
        user.PhoneNumber,
        user.Role,
        user.IsBlocked
    };
}

public class RegisterRequest
{
    [Required]
    [MaxLength(80)]
    [NoHtml]
    public string FirstName { get; set; } = null!;

    [Required]
    [MaxLength(80)]
    [NoHtml]
    public string LastName { get; set; } = null!;

    [Required]
    [MaxLength(254)]
    [EmailAddress]
    [NoHtml]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    [RegularExpression("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$",
        ErrorMessage = "Password must be 8-128 chars and include upper, lower, number and special character.")]
    public string Password { get; set; } = null!;

    [MaxLength(120)]
    [NoHtml]
    public string? CompanyName { get; set; }

    [MaxLength(2000)]
    public string? Bio { get; set; }

    [MaxLength(40)]
    [NoHtml]
    public string? PhoneNumber { get; set; }

    [MaxLength(32)]
    [NoHtml]
    public string? Role { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

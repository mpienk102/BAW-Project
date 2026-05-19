namespace GRU_APP.Backend.Models;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? CompanyName { get; set; }
    public string? Bio { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public bool IsBlocked { get; set; } = false;
    public string Role { get; set; } = "Client";
    public DateTime CreatedAt { get; set; }

    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<Inquiry> ClientInquiries { get; set; } = new List<Inquiry>();
    public ICollection<Review> ReviewsAuthored { get; set; } = new List<Review>();
}

namespace GRU_APP.Backend.Models;

public class Service
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public User Provider { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public decimal BasePrice { get; set; }
    public string PriceType { get; set; } = "fixed";
    public string LocationLabel { get; set; } = null!;
    public string ServiceArea { get; set; } = string.Empty;
    public int RadiusKm { get; set; }
    public string Turnaround { get; set; } = "Na zapytanie";
    public int ResponseTimeMinutes { get; set; } = 60;
    public bool RequiresReservation { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
    public List<string> CustomConditions { get; set; } = new List<string>();
    public ICollection<Inquiry> Inquiries { get; set; } = new List<Inquiry>();
}

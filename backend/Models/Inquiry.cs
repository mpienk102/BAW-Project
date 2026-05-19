namespace GRU_APP.Backend.Models;

public class Inquiry
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    public Guid ClientId { get; set; }
    public User Client { get; set; } = null!;
    public string Budget { get; set; } = null!;
    public string PreferredDate { get; set; } = null!;
    public string Summary { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string Status { get; set; } = "Nowe";
    public DateTime CreatedAt { get; set; }

    public ICollection<InquiryMessage> Messages { get; set; } = new List<InquiryMessage>();
}

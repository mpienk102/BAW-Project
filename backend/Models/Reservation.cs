namespace GRU_APP.Backend.Models;

public class Reservation
{
    public Guid Id { get; set; }
    
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    
    public Guid ClientId { get; set; }
    public User Client { get; set; } = null!;
    
    public DateTime AppointmentDate { get; set; }
    public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Rejected"
    public string? ClientMessage { get; set; }
}

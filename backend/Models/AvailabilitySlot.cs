namespace GRU_APP.Backend.Models;

public class AvailabilitySlot
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    public string DayLabel { get; set; } = null!;
    public string TimeWindow { get; set; } = null!;
    public string Status { get; set; } = "available";
}

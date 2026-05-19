namespace GRU_APP.Backend.Models;

public class Photo
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    
    public string PhotoUrl { get; set; } = null!;
    public int SortOrder { get; set; }
}

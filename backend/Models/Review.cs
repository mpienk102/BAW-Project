namespace GRU_APP.Backend.Models;

public class Review
{
    public Guid Id { get; set; }
    
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

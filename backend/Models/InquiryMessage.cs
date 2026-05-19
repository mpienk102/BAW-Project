namespace GRU_APP.Backend.Models;

public class InquiryMessage
{
    public Guid Id { get; set; }
    public Guid InquiryId { get; set; }
    public Inquiry Inquiry { get; set; } = null!;
    public string SenderRole { get; set; } = null!;
    public string Text { get; set; } = null!;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; }
}

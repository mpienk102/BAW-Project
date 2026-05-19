using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private const long MaxUploadBytes = 5 * 1024 * 1024; // 5 MB

    public UploadsController()
    {
    }

    [HttpPost]
    [RequestSizeLimit(MaxUploadBytes)]
    [Authorize]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded or file is empty." });
        }

        if (file.Length > MaxUploadBytes)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new
            {
                message = $"File is too large. Max allowed size is {MaxUploadBytes} bytes."
            });
        }

        // Validate extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Invalid file extension. Allowed: jpg, jpeg, png, webp." });
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        
        if (!Directory.Exists(uploadsFolder)) 
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = Guid.NewGuid().ToString() + extension;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var photoUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";

        return Ok(new { url = photoUrl });
    }
}

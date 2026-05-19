using GRU_APP.Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GRU_APP.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name })
            .ToListAsync();

        return Ok(categories);
    }
}

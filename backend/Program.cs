using System.Text;
using GRU_APP.Backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "a_very_long_secret_key_for_jwt_development";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:5173", 
                    "http://localhost:3000", 
                    "http://localhost:5174", 
                    "http://172.19.0.1:5173", 
                    "http://172.19.0.1:5174",
                    "https://baw-project-front.onrender.com" // <-- TUTAJ WPISZ ADRES SWOJEGO FRONTENDU Z RENDERA
                  ) 
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddRateLimiter(options =>
{
    // Brute-force protection (per IP). Applied to auth endpoints via attributes.
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("AuthPerIp", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

var app = builder.Build();

var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DemoDataSeeder.SeedAsync(dbContext);
}

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

// Wyciągamy Swaggera poza warunek IsDevelopment()
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
    c.RoutePrefix = "swagger"; // Sprawi, że Swagger będzie pod /swagger
});
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

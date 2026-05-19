using GRU_APP.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GRU_APP.Backend.Data;

public static class DemoDataSeeder
{
    public const string ProviderEmail = "wykonawca@demo.local";
    public const string ClientEmail = "klient@demo.local";
    public const string AdminEmail = "admin@demo.local";
    public const string DemoPassword = "Demo123!";

    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (!await context.Users.AnyAsync(u => u.Email == ProviderEmail))
        {
            var provider = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Marek",
                LastName = "Kania",
                Email = ProviderEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword),
                CompanyName = "MK Finish",
                Bio = "Specjalista od szybkich realizacji mieszkan i odswiezenia wnetrz.",
                PhoneNumber = "+48 500 100 200",
                IsEmailVerified = true,
                Role = "Provider",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(provider);
        }

        if (!await context.Users.AnyAsync(u => u.Email == ClientEmail))
        {
            var client = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Karolina",
                LastName = "Zielinska",
                Email = ClientEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword),
                CompanyName = null,
                Bio = "Klientka demo do testowania zapytan i czatu.",
                PhoneNumber = "+48 600 200 300",
                IsEmailVerified = true,
                Role = "Client",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(client);
        }

        if (!await context.Users.AnyAsync(u => u.Email == AdminEmail))
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Admin",
                LastName = "Systemu",
                Email = AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword),
                CompanyName = null,
                Bio = "Konto administratora platformy.",
                PhoneNumber = null,
                IsEmailVerified = true,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
        }

        await context.SaveChangesAsync();

        if (await context.Services.AnyAsync())
            return;

        var providerUser = await context.Users.FirstAsync(u => u.Email == ProviderEmail);
        var clientUser = await context.Users.FirstAsync(u => u.Email == ClientEmail);
        var remonty = await context.Categories.FirstAsync(c => c.Name == "Remonty");
        var sprzatanie = await context.Categories.FirstAsync(c => c.Name == "Sprzatanie");

        var paintingService = new Service
        {
            Id = Guid.NewGuid(),
            ProviderId = providerUser.Id,
            CategoryId = remonty.Id,
            Title = "Malowanie mieszkan i salonow bez smug",
            Description = "Kompleksowe malowanie wnetrz z zabezpieczeniem mebli, poprawkami gladzi i sprzataniem po realizacji.",
            BasePrice = 540,
            PriceType = "fixed",
            LocationLabel = "Warszawa Mokotow",
            ServiceArea = "Warszawa, Piaseczno, Pruszkow",
            RadiusKm = 18,
            Turnaround = "Start nawet w 48 h",
            ResponseTimeMinutes = 20,
            RequiresReservation = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            Photos = new List<Photo>
            {
                new() { Id = Guid.NewGuid(), PhotoUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80", SortOrder = 0 },
                new() { Id = Guid.NewGuid(), PhotoUrl = "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80", SortOrder = 1 }
            },
            AvailabilitySlots = new List<AvailabilitySlot>
            {
                new() { Id = Guid.NewGuid(), DayLabel = "Pt", TimeWindow = "16:00-20:00", Status = "available" },
                new() { Id = Guid.NewGuid(), DayLabel = "Sob", TimeWindow = "08:00-18:00", Status = "available" },
                new() { Id = Guid.NewGuid(), DayLabel = "Nd", TimeWindow = "10:00-16:00", Status = "busy" }
            }
        };

        var cleaningService = new Service
        {
            Id = Guid.NewGuid(),
            ProviderId = providerUser.Id,
            CategoryId = sprzatanie.Id,
            Title = "Sprzatanie mieszkan po remoncie i przed najmem",
            Description = "Ekipa dwuosobowa do gruntownego sprzatania po remontach i przygotowaniu mieszkania pod najem.",
            BasePrice = 75,
            PriceType = "hourly",
            LocationLabel = "Warszawa Wola",
            ServiceArea = "Warszawa, Blonie, Ozarow Mazowiecki",
            RadiusKm = 20,
            Turnaround = "Wolne terminy jutro",
            ResponseTimeMinutes = 35,
            RequiresReservation = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            Photos = new List<Photo>
            {
                new() { Id = Guid.NewGuid(), PhotoUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80", SortOrder = 0 }
            },
            AvailabilitySlots = new List<AvailabilitySlot>
            {
                new() { Id = Guid.NewGuid(), DayLabel = "Pt", TimeWindow = "08:00-16:00", Status = "available" },
                new() { Id = Guid.NewGuid(), DayLabel = "Sob", TimeWindow = "09:00-15:00", Status = "available" }
            }
        };

        context.Services.AddRange(paintingService, cleaningService);

        var review = new Review
        {
            Id = Guid.NewGuid(),
            Service = paintingService,
            AuthorId = clientUser.Id,
            Rating = 5,
            Comment = "Salon 25 m2 zrobiony dokladnie i w jeden dzien.",
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };

        var inquiry = new Inquiry
        {
            Id = Guid.NewGuid(),
            Service = paintingService,
            ClientId = clientUser.Id,
            Budget = "600 zl",
            PreferredDate = "Ten weekend",
            Summary = "Szukam wykonawcy do pomalowania salonu 25m2. Zalezy mi na szybkiej realizacji i cenie do 600 zl.",
            Location = "Warszawa, Sadyba",
            Status = "W trakcie",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Messages = new List<InquiryMessage>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    SenderRole = "client",
                    Text = "Czy w 600 zl da sie zamknac malowanie salonu 25 m2 w ten weekend?",
                    SentAt = DateTime.UtcNow.AddDays(-1).AddHours(9)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    SenderRole = "provider",
                    Text = "Jesli sciany sa bez wiekszych ubytkow, jest to realne. Prosze o 2-3 zdjecia.",
                    SentAt = DateTime.UtcNow.AddDays(-1).AddHours(9).AddMinutes(16)
                }
            }
        };

        context.Reviews.Add(review);
        context.Inquiries.Add(inquiry);
        await context.SaveChangesAsync();
    }
}

using GRU_APP.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GRU_APP.Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<Photo> Photos { get; set; } = null!;
    public DbSet<Reservation> Reservations { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<AvailabilitySlot> AvailabilitySlots { get; set; } = null!;
    public DbSet<Inquiry> Inquiries { get; set; } = null!;
    public DbSet<InquiryMessage> InquiryMessages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Service>()
            .Property(s => s.BasePrice)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.Client)
            .WithMany()
            .HasForeignKey(r => r.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Author)
            .WithMany(u => u.ReviewsAuthored)
            .HasForeignKey(r => r.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Service>()
            .HasOne(s => s.Provider)
            .WithMany(u => u.Services)
            .HasForeignKey(s => s.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AvailabilitySlot>()
            .HasOne(a => a.Service)
            .WithMany(s => s.AvailabilitySlots)
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Inquiry>()
            .HasOne(i => i.Client)
            .WithMany(u => u.ClientInquiries)
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Inquiry>()
            .HasOne(i => i.Service)
            .WithMany(s => s.Inquiries)
            .HasForeignKey(i => i.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InquiryMessage>()
            .HasOne(m => m.Inquiry)
            .WithMany(i => i.Messages)
            .HasForeignKey(m => m.InquiryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Remonty" },
            new Category { Id = 2, Name = "Sprzatanie" },
            new Category { Id = 3, Name = "Elektryka" },
            new Category { Id = 4, Name = "Ogrod" },
            new Category { Id = 5, Name = "IT" },
            new Category { Id = 6, Name = "Hydraulika" },
            new Category { Id = 7, Name = "Transport" }
        );
    }
}

using System.ComponentModel.DataAnnotations;

namespace GRU_APP.Backend.Validation;

/// <summary>
/// Minimal input hardening against stored XSS by rejecting HTML-like payloads.
/// This is intentionally strict for fields that should never contain markup.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NoHtmlAttribute : ValidationAttribute
{
    public NoHtmlAttribute()
        : base("Field contains disallowed characters.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        if (value is not string text) return true;

        // Reject HTML tag delimiters and other obvious injection primitives.
        if (text.Contains('<') || text.Contains('>'))
            return false;

        // Reject null bytes and other control chars (except common whitespace).
        foreach (var ch in text)
        {
            if (char.IsControl(ch) && ch is not '\r' and not '\n' and not '\t')
                return false;
        }

        return true;
    }
}


using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public sealed class UpdateTodoRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? DueAt { get; set; }
}

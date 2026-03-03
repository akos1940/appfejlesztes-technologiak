namespace Backend.Models;

public sealed class PagedResponse<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required long Total { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
}

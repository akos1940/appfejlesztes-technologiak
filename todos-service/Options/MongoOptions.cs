using System.ComponentModel.DataAnnotations;

namespace TodosService.Options;

public sealed class MongoOptions
{
    public const string SectionName = "Mongo";

    [Required]
    public string ConnectionString { get; init; } = null!;

    [Required]
    public string DatabaseName { get; init; } = null!;

    [Required]
    public string TodosCollectionName { get; init; } = null!;
}

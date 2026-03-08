using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodosService.Models;

public sealed class TodoItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public required string Title { get; set; }

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("isCompleted")]
    public bool IsCompleted { get; set; }

    [BsonElement("dueAt")]
    [BsonIgnoreIfNull]
    public DateTime? DueAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

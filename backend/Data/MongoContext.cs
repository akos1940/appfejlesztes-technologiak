using Backend.Options;
using Backend.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Backend.Data;

public sealed class MongoContext
{
    public IMongoCollection<TodoItem> Todos { get; }

    public MongoContext(IOptions<MongoOptions> options)
    {
        var mongo = options.Value;
        var client = new MongoClient(mongo.ConnectionString);
        var database = client.GetDatabase(mongo.DatabaseName);
        Todos = database.GetCollection<TodoItem>(mongo.TodosCollectionName);
    }
}

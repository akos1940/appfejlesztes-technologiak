using Backend.Data;
using Backend.Models;
using MongoDB.Driver;

namespace Backend.Repositories;

public sealed class TodoRepository
{
    private readonly MongoContext _context;

    public TodoRepository(MongoContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<TodoItem> Items, long Total)> GetPagedAsync(int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var filter = Builders<TodoItem>.Filter.Empty;
        var totalTask = _context.Todos.CountDocumentsAsync(filter, cancellationToken: ct);
        var itemsTask = _context.Todos
            .Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

        await Task.WhenAll(totalTask, itemsTask);
        return (itemsTask.Result, totalTask.Result);
    }

    public Task<TodoItem?> GetByIdAsync(string id, CancellationToken ct)
    {
        return GetByIdInternalAsync(id, ct);
    }

    private async Task<TodoItem?> GetByIdInternalAsync(string id, CancellationToken ct)
    {
        return await _context.Todos.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
    }

    public async Task<TodoItem> CreateAsync(TodoItem item, CancellationToken ct)
    {
        await _context.Todos.InsertOneAsync(item, cancellationToken: ct);
        return item;
    }

    public async Task<bool> ReplaceAsync(string id, TodoItem item, CancellationToken ct)
    {
        item.Id = id;
        var result = await _context.Todos.ReplaceOneAsync(x => x.Id == id, item, cancellationToken: ct);
        return result.MatchedCount == 1;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await _context.Todos.DeleteOneAsync(x => x.Id == id, ct);
        return result.DeletedCount == 1;
    }
}

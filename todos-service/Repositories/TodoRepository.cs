using MongoDB.Driver;
using TodosService.Data;
using TodosService.Models;

namespace TodosService.Repositories;

public sealed class TodoRepository
{
    private const string SeedDescriptionMarker = "Alapértelmezett (seed) feladat";
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

    public async Task EnsureSeededAsync(CancellationToken ct)
    {
        var desiredSeedTitles = new[] { "Bevásárlás", "Számla befizetés", "Edzés", "Határidős munka" };

        // Régebbi mintaadatok (cím/leírás), amiket érdemes kitakarítani.
        var obsoleteSeedTitles = new[] { "tej", "kenyér", "tojás", "alma", "Tanulás", "Takarítás", "Számlák befizetése" };
        var obsoleteSeedDescriptions = new[]
        {
            "tej, kenyér, tojás",
            "tej, kenyér, tojás, alma",
            "tej, kenyér, tojás, körte",
        };

        var managedSeedTitles = desiredSeedTitles
            .Concat(obsoleteSeedTitles)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var anyDocumentsExist = await _context.Todos
            .Find(Builders<TodoItem>.Filter.Empty)
            .Limit(1)
            .AnyAsync(ct);

        // Üres gyűjteménynél beszúrjuk az alap feladatokat.
        if (!anyDocumentsExist)
        {
            var now = DateTime.UtcNow;
            var items = desiredSeedTitles
                .Select((title, index) => new TodoItem
                {
                    Title = title,
                    Description = SeedDescriptionMarker,
                    IsCompleted = false,
                    CreatedAt = now.AddSeconds(-index),
                })
                .ToArray();

            await _context.Todos.InsertManyAsync(items, cancellationToken: ct);
            return;
        }

        // Régi seed elemek törlése (a felhasználói elemeket nem bántjuk).
        // 1) Régi mintaelemek törlése ismert leírás alapján.
        if (obsoleteSeedDescriptions.Length > 0)
        {
            await _context.Todos.DeleteManyAsync(
                Builders<TodoItem>.Filter.In(x => x.Description, obsoleteSeedDescriptions),
                ct);
        }

        // 2) Korábbi seed elemek törlése, amik már nincsenek az alap listában.
        var titlesToRemove = managedSeedTitles
            .Where(t => !desiredSeedTitles.Contains(t, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (titlesToRemove.Length > 0)
        {
            var removeFilter = Builders<TodoItem>.Filter.And(
                Builders<TodoItem>.Filter.Eq(x => x.Description, SeedDescriptionMarker),
                Builders<TodoItem>.Filter.In(x => x.Title, titlesToRemove));

            await _context.Todos.DeleteManyAsync(removeFilter, ct);
        }

        // 3) Régi, cím alapú seed maradványok törlése (ha léteznek).
        await _context.Todos.DeleteManyAsync(
            Builders<TodoItem>.Filter.In(x => x.Title, new[] { "tej", "kenyér", "tojás", "alma" }),
            ct);

        // Hiányzó alap feladatok pótlása (a felhasználói elemekhez nem nyúlunk).
        var existingDesiredTitles = await _context.Todos
            .Find(Builders<TodoItem>.Filter.In(x => x.Title, desiredSeedTitles))
            .Project(x => x.Title)
            .ToListAsync(ct);

        var missingDesiredTitles = desiredSeedTitles
            .Where(t => !existingDesiredTitles.Contains(t, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingDesiredTitles.Length == 0)
        {
            return;
        }

        var now2 = DateTime.UtcNow;
        var newItems = missingDesiredTitles
            .Select((title, index) => new TodoItem
            {
                Title = title,
                Description = SeedDescriptionMarker,
                IsCompleted = false,
                CreatedAt = now2.AddSeconds(-index),
            })
            .ToArray();

        await _context.Todos.InsertManyAsync(newItems, cancellationToken: ct);
    }
}

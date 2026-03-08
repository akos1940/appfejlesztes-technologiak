using Microsoft.AspNetCore.Mvc;
using TodosService.Models;
using TodosService.Repositories;

namespace TodosService.Controllers;

[ApiController]
[Route("api/todos")]
public sealed class TodosController : ControllerBase
{
    private readonly TodoRepository _repository;

    public TodosController(TodoRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TodoItem>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var (items, total) = await _repository.GetPagedAsync(page, pageSize, ct);
        return Ok(new PagedResponse<TodoItem>
        {
            Items = items,
            Total = total,
            Page = Math.Max(1, page),
            PageSize = Math.Clamp(pageSize, 1, 100),
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoItem>> GetById(string id, CancellationToken ct)
    {
        var item = await _repository.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TodoItem>> Create([FromBody] CreateTodoRequest request, CancellationToken ct)
    {
        var item = new TodoItem
        {
            Title = request.Title,
            Description = request.Description,
            IsCompleted = request.IsCompleted,
            DueAt = request.DueAt,
            CreatedAt = DateTime.UtcNow,
        };

        await _repository.CreateAsync(item, ct);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Replace(string id, [FromBody] UpdateTodoRequest request, CancellationToken ct)
    {
        var existing = await _repository.GetByIdAsync(id, ct);
        if (existing is null)
        {
            return NotFound();
        }

        var updated = new TodoItem
        {
            Title = request.Title,
            Description = request.Description,
            IsCompleted = request.IsCompleted,
            DueAt = request.DueAt,
            CreatedAt = existing.CreatedAt,
        };

        await _repository.ReplaceAsync(id, updated, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var ok = await _repository.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}

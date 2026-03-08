using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/todos")]
public sealed class TodosController : ControllerBase
{
    private readonly TodosClient _client;

    public TodosController(TodosClient client)
    {
        _client = client;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TodoItem>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        HttpResponseMessage resp;
        try
        {
            resp = await _client.GetPagedAsync(page, pageSize, ct);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503);
        }
        if (!resp.IsSuccessStatusCode)
        {
            return StatusCode((int)resp.StatusCode);
        }

        var payload = await resp.Content.ReadFromJsonAsync<PagedResponse<TodoItem>>(cancellationToken: ct);
        return payload is null ? StatusCode(502) : Ok(payload);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoItem>> GetById(string id, CancellationToken ct)
    {
        HttpResponseMessage resp;
        try
        {
            resp = await _client.GetByIdAsync(id, ct);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503);
        }
        if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound();
        }

        if (!resp.IsSuccessStatusCode)
        {
            return StatusCode((int)resp.StatusCode);
        }

        var payload = await resp.Content.ReadFromJsonAsync<TodoItem>(cancellationToken: ct);
        return payload is null ? StatusCode(502) : Ok(payload);
    }

    [HttpPost]
    public async Task<ActionResult<TodoItem>> Create([FromBody] CreateTodoRequest request, CancellationToken ct)
    {
        HttpResponseMessage resp;
        try
        {
            resp = await _client.CreateAsync(request, ct);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503);
        }
        if (!resp.IsSuccessStatusCode)
        {
            return StatusCode((int)resp.StatusCode);
        }

        var payload = await resp.Content.ReadFromJsonAsync<TodoItem>(cancellationToken: ct);
        if (payload is null)
        {
            return StatusCode(502);
        }

        return CreatedAtAction(nameof(GetById), new { id = payload.Id }, payload);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Replace(string id, [FromBody] UpdateTodoRequest request, CancellationToken ct)
    {
        HttpResponseMessage resp;
        try
        {
            resp = await _client.ReplaceAsync(id, request, ct);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503);
        }
        if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound();
        }

        if (!resp.IsSuccessStatusCode)
        {
            return StatusCode((int)resp.StatusCode);
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        HttpResponseMessage resp;
        try
        {
            resp = await _client.DeleteAsync(id, ct);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503);
        }
        if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound();
        }

        if (!resp.IsSuccessStatusCode)
        {
            return StatusCode((int)resp.StatusCode);
        }

        return NoContent();
    }
}

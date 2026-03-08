using System.Net.Http.Json;

namespace Backend.Services;

public sealed class TodosClient
{
    private readonly HttpClient _http;

    public TodosClient(HttpClient http)
    {
        _http = http;
    }

    public Task<HttpResponseMessage> GetPagedAsync(int page, int pageSize, CancellationToken ct)
    {
        return _http.GetAsync($"api/todos?page={page}&pageSize={pageSize}", ct);
    }

    public Task<HttpResponseMessage> GetByIdAsync(string id, CancellationToken ct)
    {
        return _http.GetAsync($"api/todos/{Uri.EscapeDataString(id)}", ct);
    }

    public Task<HttpResponseMessage> CreateAsync<TRequest>(TRequest request, CancellationToken ct)
    {
        return _http.PostAsJsonAsync("api/todos", request, cancellationToken: ct);
    }

    public Task<HttpResponseMessage> ReplaceAsync<TRequest>(string id, TRequest request, CancellationToken ct)
    {
        return _http.PutAsJsonAsync($"api/todos/{Uri.EscapeDataString(id)}", request, cancellationToken: ct);
    }

    public Task<HttpResponseMessage> DeleteAsync(string id, CancellationToken ct)
    {
        return _http.DeleteAsync($"api/todos/{Uri.EscapeDataString(id)}", ct);
    }
}

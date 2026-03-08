using Microsoft.Extensions.DependencyInjection;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddOpenApi();
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true));
});

var todosServiceBaseUrl = builder.Configuration.GetValue<string>("TodosService:BaseUrl")
    ?? throw new InvalidOperationException("Missing configuration: TodosService:BaseUrl");

builder.Services.AddHttpClient<TodosClient>(client =>
{
    client.BaseAddress = new Uri(todosServiceBaseUrl, UriKind.Absolute);
});

var app = builder.Build();

// Pipeline
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

await app.RunAsync();

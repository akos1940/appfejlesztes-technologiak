using Backend.Data;
using Backend.Options;
using Backend.Repositories;
using Microsoft.Extensions.DependencyInjection;

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

builder.Services
    .AddOptions<MongoOptions>()
    .Bind(builder.Configuration.GetSection(MongoOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<TodoRepository>();

var app = builder.Build();

// Pipeline
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

// Seed sample data (only if collection is empty)
if (builder.Configuration.GetValue("SeedData:Enabled", true))
{
    using var scope = app.Services.CreateScope();
    var repo = scope.ServiceProvider.GetRequiredService<TodoRepository>();
    await repo.EnsureSeededAsync(CancellationToken.None);
}

await app.RunAsync();

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTodoRequest, PagedResponse, TodoItem, UpdateTodoRequest } from './todo.models';

@Injectable({ providedIn: 'root' })
export class TodoService {
  constructor(private readonly http: HttpClient) {}

  list(page: number, pageSize: number): Observable<PagedResponse<TodoItem>> {
    return this.http.get<PagedResponse<TodoItem>>(`/api/todos?page=${page}&pageSize=${pageSize}`);
  }

  getById(id: string): Observable<TodoItem> {
    return this.http.get<TodoItem>(`/api/todos/${encodeURIComponent(id)}`);
  }

  create(request: CreateTodoRequest): Observable<TodoItem> {
    return this.http.post<TodoItem>(`/api/todos`, request);
  }

  replace(id: string, request: UpdateTodoRequest): Observable<void> {
    return this.http.put<void>(`/api/todos/${encodeURIComponent(id)}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/todos/${encodeURIComponent(id)}`);
  }
}

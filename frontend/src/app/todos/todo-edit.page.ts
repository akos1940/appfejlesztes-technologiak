import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TodoService } from './todo.service';
import { CreateTodoRequest, TodoItem } from './todo.models';

@Component({
  selector: 'app-todo-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './todo-edit.page.html',
  styleUrl: './todo-edit.page.css',
})
export class TodoEditPage {
  private readonly service = inject(TodoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  id: string | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  title = '';
  description = '';
  isCompleted = false;
  dueAtLocal: string = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.id = params.get('id');
      if (!this.id) {
        this.loading = false;
        return;
      }

      this.loading = true;
      this.service.getById(this.id).subscribe({
        next: (item) => {
          this.loadFromItem(item);
          this.loading = false;
        },
        error: () => {
          this.error = 'Nem található elem.';
          this.loading = false;
        },
      });
    });
  }

  private loadFromItem(item: TodoItem) {
    this.title = item.title;
    this.description = item.description ?? '';
    this.isCompleted = item.isCompleted;
    this.dueAtLocal = item.dueAt ? this.toLocalInputValue(item.dueAt) : '';
  }

  private toLocalInputValue(iso: string): string {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private buildRequest(): CreateTodoRequest {
    const dueAt = this.dueAtLocal ? new Date(this.dueAtLocal).toISOString() : null;
    return {
      title: this.title.trim(),
      description: this.description.trim() ? this.description.trim() : null,
      isCompleted: this.isCompleted,
      dueAt,
    };
  }

  async save() {
    this.error = null;
    if (!this.title.trim()) {
      this.error = 'A cím kötelező.';
      return;
    }

    this.saving = true;
    const request = this.buildRequest();

    if (!this.id) {
      this.service.create(request).subscribe({
        next: async () => {
          this.saving = false;
          await this.router.navigate(['/todos']);
        },
        error: () => {
          this.error = 'Mentés nem sikerült.';
          this.saving = false;
        },
      });
      return;
    }

    this.service.replace(this.id, request).subscribe({
      next: async () => {
        this.saving = false;
        await this.router.navigate(['/todos']);
      },
      error: () => {
        this.error = 'Mentés nem sikerült.';
        this.saving = false;
      },
    });
  }
}

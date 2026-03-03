import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, startWith, timeout } from 'rxjs';
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

  readonly id = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  title = '';
  description = '';
  isCompleted = false;
  dueAtLocal: string = '';

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(), startWith(this.route.snapshot.paramMap))
      .subscribe((params) => {
        const id = params.get('id');
        this.id.set(id);
        this.error.set(null);

        if (!id) {
          this.loading.set(false);
          return;
        }

        this.loading.set(true);
        this.service
          .getById(id)
          .pipe(
            timeout({ first: 10000 }),
            catchError((err: any) => {
              console.error('Todo betöltés hiba', err);
              this.error.set('Nem található elem.');
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          )
          .subscribe((item) => {
            if (!item) return;
            this.loadFromItem(item);
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
    this.error.set(null);
    if (!this.title.trim()) {
      this.error.set('A cím kötelező.');
      return;
    }

    this.saving.set(true);
    const request = this.buildRequest();

    const id = this.id();
    if (!id) {
      this.service.create(request).subscribe({
        next: async () => {
          this.saving.set(false);
          await this.router.navigate(['/todos']);
        },
        error: () => {
          this.error.set('Mentés nem sikerült.');
          this.saving.set(false);
        },
      });
      return;
    }

    this.service.replace(id, request).subscribe({
      next: async () => {
        this.saving.set(false);
        await this.router.navigate(['/todos']);
      },
      error: () => {
        this.error.set('Mentés nem sikerült.');
        this.saving.set(false);
      },
    });
  }
}

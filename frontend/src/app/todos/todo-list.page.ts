import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, startWith, switchMap, timeout } from 'rxjs';
import { TodoService } from './todo.service';
import { TodoItem } from './todo.models';

@Component({
  selector: 'app-todo-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './todo-list.page.html',
  styleUrl: './todo-list.page.css',
})
export class TodoListPage {
  private readonly service = inject(TodoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly items = signal<TodoItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(),
        startWith(this.route.snapshot.queryParamMap),
        switchMap((params) => {
          const page = Math.max(1, Number(params.get('page') ?? 1));
          const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 10)));
          this.page.set(page);
          this.pageSize.set(pageSize);
          this.loading.set(true);
          this.error.set(null);
          return this.service.list(page, pageSize).pipe(
            timeout({ first: 10000 }),
            catchError((err: any) => {
              const status = err?.status ?? 'ismeretlen';
              console.error('Todos betöltés hiba', err);
              this.error.set(`Nem sikerült lekérni a listát. (HTTP: ${status})`);
              return of({ items: [], total: 0, page, pageSize });
            }),
            finalize(() => {
              this.loading.set(false);
            })
          );
        })
      )
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.page.set(res.page);
          this.pageSize.set(res.pageSize);
        },
      });
  }

  async goToPage(page: number) {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, pageSize: this.pageSize() },
      queryParamsHandling: 'merge',
    });
  }

  async changePageSize(pageSizeValue: string) {
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeValue)));
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1, pageSize },
      queryParamsHandling: 'merge',
    });
  }

  delete(item: TodoItem) {
    if (!item.id) return;
    this.service.delete(item.id).subscribe({
      next: () => void this.goToPage(this.page()),
      error: () => this.error.set('Törlés nem sikerült.'),
    });
  }
}

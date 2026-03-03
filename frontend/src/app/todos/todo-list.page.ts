import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
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

  items: TodoItem[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  loading = true;
  error: string | null = null;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total / this.pageSize)));

  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          this.page = Math.max(1, Number(params.get('page') ?? 1));
          this.pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 10)));
          this.loading = true;
          this.error = null;
          return this.service.list(this.page, this.pageSize);
        })
      )
      .subscribe({
        next: (res) => {
          this.items = res.items;
          this.total = res.total;
          this.page = res.page;
          this.pageSize = res.pageSize;
          this.loading = false;
        },
        error: () => {
          this.error = 'Nem sikerült lekérni a listát.';
          this.loading = false;
        },
      });
  }

  async goToPage(page: number) {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, pageSize: this.pageSize },
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
      next: () => void this.goToPage(this.page),
      error: () => (this.error = 'Törlés nem sikerült.'),
    });
  }
}

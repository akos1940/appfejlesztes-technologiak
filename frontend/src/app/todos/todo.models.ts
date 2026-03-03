export type TodoItem = {
  id?: string | null;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  dueAt?: string | null;
  createdAt: string;
};

export type CreateTodoRequest = {
  title: string;
  description?: string | null;
  isCompleted: boolean;
  dueAt?: string | null;
};

export type UpdateTodoRequest = CreateTodoRequest;

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

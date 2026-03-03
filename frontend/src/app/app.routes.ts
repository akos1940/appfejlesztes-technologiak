import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'todos' },
	{
		path: 'todos',
		loadComponent: () => import('./todos/todo-list.page').then(m => m.TodoListPage)
	},
	{
		path: 'todos/new',
		loadComponent: () => import('./todos/todo-edit.page').then(m => m.TodoEditPage)
	},
	{
		path: 'todos/:id',
		loadComponent: () => import('./todos/todo-edit.page').then(m => m.TodoEditPage)
	},
	{ path: '**', redirectTo: 'todos' },
];

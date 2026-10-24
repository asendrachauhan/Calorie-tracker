import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'signup',
    loadComponent: () => import('./features/user/pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
    title: 'Net Calorie Tracker - Sign Up'
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes)
  },
  { path: '**', redirectTo: 'users' }
];

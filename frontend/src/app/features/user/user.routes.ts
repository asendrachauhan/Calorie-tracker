import { Routes } from '@angular/router';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { UserDataComponent } from './pages/user-data/user-data.component';
import { UserDetailsComponent } from './pages/user-details/user-details.component';

export const userRoutes: Routes = [
  { path: '', component: UserListComponent, title: 'Net Calorie Tracker - User List' },
  { path: 'signup', component: SignUpComponent, title: 'Net Calorie Tracker - Sign Up' },
  { path: ':id/data', component: UserDataComponent, title: 'Net Calorie Tracker - User Data History' },
  { path: ':id/details', component: UserDetailsComponent, title: 'Net Calorie Tracker - Day Details' }
];

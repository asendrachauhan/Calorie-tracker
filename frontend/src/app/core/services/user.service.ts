import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User, CreateUserDto } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string; code?: string; details?: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData).pipe(
      map(res => res.data)
    );
  }

  deleteUser(id: string): Observable<{ message: string; deletedRecords: number }> {
    return this.http.delete<ApiResponse<{ message: string; deletedRecords: number }>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}

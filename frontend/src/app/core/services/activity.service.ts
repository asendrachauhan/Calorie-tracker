import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Activity } from '../models/activity.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: { message: string; code?: string };
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/activities`;

  searchActivities(search?: string, category?: string, limit: number = 50): Observable<Activity[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (category && category.trim()) {
      params = params.set('category', category.trim());
    }
    return this.http.get<ApiResponse<Activity[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getActivityCategories(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/categories`).pipe(
      map(res => res.data)
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
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
  private defaultActivitiesCache$?: Observable<Activity[]>;
  private activityCategoriesCache$?: Observable<string[]>;

  searchActivities(search?: string, category?: string, limit: number = 50): Observable<Activity[]> {
    const isDefaultQuery = (!search || !search.trim()) && (!category || !category.trim());
    if (isDefaultQuery) {
      if (!this.defaultActivitiesCache$) {
        const params = new HttpParams().set('limit', limit.toString());
        this.defaultActivitiesCache$ = this.http.get<ApiResponse<Activity[]>>(this.apiUrl, { params }).pipe(
          map(res => res.data),
          shareReplay(1)
        );
      }
      return this.defaultActivitiesCache$;
    }

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
    if (!this.activityCategoriesCache$) {
      this.activityCategoriesCache$ = this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/categories`).pipe(
        map(res => res.data),
        shareReplay(1)
      );
    }
    return this.activityCategoriesCache$;
  }
}

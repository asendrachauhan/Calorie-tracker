import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Food } from '../models/food.model';
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
export class FoodService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/foods`;

  searchFoods(search?: string, group?: string, limit: number = 50): Observable<Food[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (group && group.trim()) {
      params = params.set('group', group.trim());
    }
    return this.http.get<ApiResponse<Food[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getFoodGroups(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/groups`).pipe(
      map(res => res.data)
    );
  }

  getFoodById(foodId: number): Observable<Food> {
    return this.http.get<ApiResponse<Food>>(`${this.apiUrl}/${foodId}`).pipe(
      map(res => res.data)
    );
  }
}

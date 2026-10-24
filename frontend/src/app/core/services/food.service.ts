import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
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
  private defaultFoodsCache$?: Observable<Food[]>;
  private foodGroupsCache$?: Observable<string[]>;

  searchFoods(search?: string, group?: string, limit: number = 50): Observable<Food[]> {
    const isDefaultQuery = (!search || !search.trim()) && (!group || !group.trim());
    if (isDefaultQuery) {
      if (!this.defaultFoodsCache$) {
        const params = new HttpParams().set('limit', limit.toString());
        this.defaultFoodsCache$ = this.http.get<ApiResponse<Food[]>>(this.apiUrl, { params }).pipe(
          map(res => res.data),
          shareReplay(1)
        );
      }
      return this.defaultFoodsCache$;
    }

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
    if (!this.foodGroupsCache$) {
      this.foodGroupsCache$ = this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/groups`).pipe(
        map(res => res.data),
        shareReplay(1)
      );
    }
    return this.foodGroupsCache$;
  }

  getFoodById(foodId: number): Observable<Food> {
    return this.http.get<ApiResponse<Food>>(`${this.apiUrl}/${foodId}`).pipe(
      map(res => res.data)
    );
  }
}

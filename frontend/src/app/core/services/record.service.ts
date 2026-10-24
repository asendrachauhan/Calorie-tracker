import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DailyRecord, AddFoodDto, AddActivityDto } from '../models/record.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string; code?: string };
}

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUserRecords(userId: string): Observable<DailyRecord[]> {
    return this.http.get<ApiResponse<DailyRecord[]>>(`${this.apiUrl}/${userId}/records`).pipe(
      map(res => res.data)
    );
  }

  getRecordByDate(userId: string, date: string): Observable<DailyRecord> {
    return this.http.get<ApiResponse<DailyRecord>>(`${this.apiUrl}/${userId}/records/${date}`).pipe(
      map(res => res.data)
    );
  }

  addFoodEntry(userId: string, date: string, entry: AddFoodDto): Observable<DailyRecord> {
    return this.http.post<ApiResponse<DailyRecord>>(`${this.apiUrl}/${userId}/records/${date}/foods`, entry).pipe(
      map(res => res.data)
    );
  }

  removeFoodEntry(userId: string, date: string, entryId: string): Observable<DailyRecord> {
    return this.http.delete<ApiResponse<DailyRecord>>(`${this.apiUrl}/${userId}/records/${date}/foods/${entryId}`).pipe(
      map(res => res.data)
    );
  }

  addActivityEntry(userId: string, date: string, entry: AddActivityDto): Observable<DailyRecord> {
    return this.http.post<ApiResponse<DailyRecord>>(`${this.apiUrl}/${userId}/records/${date}/activities`, entry).pipe(
      map(res => res.data)
    );
  }

  removeActivityEntry(userId: string, date: string, entryId: string): Observable<DailyRecord> {
    return this.http.delete<ApiResponse<DailyRecord>>(`${this.apiUrl}/${userId}/records/${date}/activities/${entryId}`).pipe(
      map(res => res.data)
    );
  }
}

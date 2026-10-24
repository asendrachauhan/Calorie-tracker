import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { UserService, RecordService, ToastService } from '../../../../core/services';
import { User, DailyRecord } from '../../../../core/models';
import { getLocalDateString } from '../../../../core/utils/date.utils';
import { CustomDatepickerComponent } from '../../../../shared/components/custom-datepicker/custom-datepicker.component';
import { AddDataModalComponent } from '../../../../shared/components/add-data-modal/add-data-modal.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-user-data',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CustomDatepickerComponent,
    AddDataModalComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
    LoadingStateComponent
  ],
  templateUrl: './user-data.component.html',
  styleUrl: './user-data.component.css'
})
export class UserDataComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private recordService = inject(RecordService);
  private toastService = inject(ToastService);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);

  userId = '';
  user: User | null = null;
  records: DailyRecord[] = [];
  isLoading = true;
  errorMessage = '';

  selectedDate = getLocalDateString();
  isModalOpen = false;
  activeModalTab: 'food' | 'activity' = 'food';

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Users', url: ['/users'] },
    { label: 'User History', active: true }
  ];

  private updateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Users', url: ['/users'] },
      { label: this.user?.name || 'User History', active: true }
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id') || '';
      this.updateBreadcrumbs();
      if (this.userId) {
        this.loadInitialData();
      }
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.titleService.setTitle(`Net Calorie Tracker - ${user.name} History`);
        this.updateBreadcrumbs();
        this.loadRecords();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load user profile.';
        this.toastService.showError('Failed to load user profile.');
        this.cdr.markForCheck();
      }
    });
  }

  loadRecords(): void {
    this.recordService.getUserRecords(this.userId).subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load daily records.';
        this.toastService.showError('Failed to load daily records.');
        this.cdr.markForCheck();
      }
    });
  }

  retryLoading(): void {
    this.loadInitialData();
  }

  onDateChanged(date: string): void {
    this.selectedDate = date;
    this.cdr.markForCheck();
  }

  openAddData(tab: 'food' | 'activity' = 'food'): void {
    this.activeModalTab = tab;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  onDataSaved(event: { type: 'food' | 'activity'; date: string }): void {
    this.toastService.showSuccess(`Successfully logged ${event.type} for ${event.date}!`);
    this.loadRecords();
  }

  goToDayDetails(): void {
    if (!this.selectedDate) return;
    this.router.navigate(['/users', this.userId, 'details'], {
      queryParams: { date: this.selectedDate }
    });
  }
}

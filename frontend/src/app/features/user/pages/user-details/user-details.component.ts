import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { UserService, RecordService, ToastService, ConfirmDialogService } from '../../../../core/services';
import { User, DailyRecord } from '../../../../core/models';
import { getLocalDateString, formatDisplayDate } from '../../../../core/utils/date.utils';
import { CustomDatepickerComponent } from '../../../../shared/components/custom-datepicker/custom-datepicker.component';
import { AddDataModalComponent } from '../../../../shared/components/add-data-modal/add-data-modal.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomDatepickerComponent,
    AddDataModalComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
    LoadingStateComponent
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private recordService = inject(RecordService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmDialogService);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);

  userId = '';
  user: User | null = null;
  record: DailyRecord | null = null;

  selectedDate = getLocalDateString();
  isLoading = true;
  loadingMessage = 'Loading daily nutrition & activity records...';
  errorMessage = '';

  isModalOpen = false;
  activeModalTab: 'food' | 'activity' = 'food';

  get displayFormattedDate(): string {
    return formatDisplayDate(this.selectedDate);
  }

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Users', url: ['/users'] },
    { label: 'User History', url: ['/users'] },
    { label: 'Daily Details', active: true }
  ];

  private updateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Users', url: ['/users'] },
      { label: this.user?.name || 'User History', url: this.userId ? ['/users', this.userId, 'data'] : ['/users'] },
      { label: `Daily Details (${this.displayFormattedDate})`, active: true }
    ];
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const paramId = params.get('id') || '';
      const qDate = queryParams.get('date');

      if (qDate) {
        this.selectedDate = qDate;
      }
      this.userId = paramId;
      this.updateBreadcrumbs();
      if (this.userId) {
        this.loadInitialData();
      }
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.loadingMessage = 'Loading user profile and daily records...';
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.titleService.setTitle(`Net Calorie Tracker - ${user.name} Details (${this.displayFormattedDate})`);
        this.updateBreadcrumbs();
        this.loadDailyRecord();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load user profile.';
        this.toastService.showError('Failed to load user profile.');
        this.cdr.markForCheck();
      }
    });
  }

  loadDailyRecord(): void {
    this.recordService.getRecordByDate(this.userId, this.selectedDate).subscribe({
      next: (record) => {
        this.record = record;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load calorie record for this date.';
        this.toastService.showError('Failed to load calorie record for this date.');
        this.cdr.markForCheck();
      }
    });
  }

  retryLoading(): void {
    this.loadInitialData();
  }

  onDateChanged(newDate: string): void {
    this.selectedDate = newDate;
    this.updateBreadcrumbs();
    this.loadDailyRecord();
  }

  openAddData(tab: 'food' | 'activity' = 'food'): void {
    this.activeModalTab = tab;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  onDataSaved(event: { type: 'food' | 'activity'; date: string }): void {
    this.selectedDate = event.date;
    this.updateBreadcrumbs();
    this.toastService.showSuccess(`Successfully logged ${event.type}!`);
    this.loadDailyRecord();
  }

  async deleteFoodEntry(entryId: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete Food Entry',
      message: 'Are you sure you want to remove this food entry? This will update your daily calories consumed.',
      confirmText: 'Delete',
      isDangerous: true
    });

    if (!confirmed) return;

    // Optimistic removal: calculate new totals and remove entry immediately
    const previousRecord = this.record ? { ...this.record, foodEntries: [...this.record.foodEntries] } : null;
    if (this.record) {
      const removedEntry = this.record.foodEntries.find(e => e._id === entryId);
      const caloriesToRemove = removedEntry?.calculatedCalories || 0;
      const newFoodEntries = this.record.foodEntries.filter(e => e._id !== entryId);
      const newTotalIn = Math.max(0, this.record.totalCaloriesIn - caloriesToRemove);
      const newNet = newTotalIn - this.record.bmr - this.record.totalCaloriesOut;
      this.record = {
        ...this.record,
        foodEntries: newFoodEntries,
        totalCaloriesIn: newTotalIn,
        netCalories: newNet
      };
      this.cdr.markForCheck();
    }

    this.recordService.removeFoodEntry(this.userId, this.selectedDate, entryId).subscribe({
      next: (updatedRecord) => {
        this.record = updatedRecord;
        this.toastService.showSuccess('Food entry removed successfully.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback state on error
        this.record = previousRecord;
        const errMsg = err.error?.error?.message || 'Failed to remove food entry. Changes reverted.';
        this.toastService.showError(errMsg);
        this.cdr.markForCheck();
      }
    });
  }

  async deleteActivityEntry(entryId: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete Activity Entry',
      message: 'Are you sure you want to remove this activity entry? This will update your daily calories burned.',
      confirmText: 'Delete',
      isDangerous: true
    });

    if (!confirmed) return;

    // Optimistic removal: calculate new totals and remove entry immediately
    const previousRecord = this.record ? { ...this.record, activityEntries: [...this.record.activityEntries] } : null;
    if (this.record) {
      const removedEntry = this.record.activityEntries.find(e => e._id === entryId);
      const caloriesToRemove = removedEntry?.calculatedCaloriesBurned || 0;
      const newActivityEntries = this.record.activityEntries.filter(e => e._id !== entryId);
      const newTotalOut = Math.max(0, this.record.totalCaloriesOut - caloriesToRemove);
      const newNet = this.record.totalCaloriesIn - this.record.bmr - newTotalOut;
      this.record = {
        ...this.record,
        activityEntries: newActivityEntries,
        totalCaloriesOut: newTotalOut,
        netCalories: newNet
      };
      this.cdr.markForCheck();
    }

    this.recordService.removeActivityEntry(this.userId, this.selectedDate, entryId).subscribe({
      next: (updatedRecord) => {
        this.record = updatedRecord;
        this.toastService.showSuccess('Activity entry removed successfully.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback state on error
        this.record = previousRecord;
        const errMsg = err.error?.error?.message || 'Failed to remove activity entry. Changes reverted.';
        this.toastService.showError(errMsg);
        this.cdr.markForCheck();
      }
    });
  }
}

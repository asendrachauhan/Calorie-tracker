import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService, ToastService, ConfirmDialogService } from '../../../../core/services';
import { User } from '../../../../core/models';
import { AddDataModalComponent } from '../../../../shared/components/add-data-modal/add-data-modal.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    AddDataModalComponent,
    EmptyStateComponent,
    LoadingStateComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmDialogService);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);

  users: User[] = [];
  searchTerm = '';
  debouncedSearchTerm = '';
  isLoading = true;
  errorMessage = '';

  isModalOpen = false;
  activeUser: User | null = null;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  get filteredUsers(): User[] {
    const term = this.debouncedSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.users;
    }
    return this.users.filter(u => u.name.toLowerCase().includes(term));
  }

  ngOnInit(): void {
    this.titleService.setTitle('Net Calorie Tracker - User List');
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => {
      this.debouncedSearchTerm = term;
      this.cdr.markForCheck();
    });
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.debouncedSearchTerm = '';
    this.searchSubject.next('');
    this.cdr.markForCheck();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load users from backend API.';
        this.toastService.showError('Failed to load users from backend API.');
        this.cdr.markForCheck();
        console.error(err);
      }
    });
  }

  openAddData(user: User): void {
    this.activeUser = user;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  onDataSaved(event: { type: 'food' | 'activity'; date: string }): void {
    const msg = `Successfully added ${event.type} entry for ${this.activeUser?.name} on ${event.date}!`;
    this.toastService.showSuccess(msg);
    this.cdr.markForCheck();
  }

  async confirmDelete(user: User): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete User Profile',
      message: `Are you sure you want to delete ${user.name}? All associated daily calorie records and snapshots will be permanently removed.`,
      confirmText: 'Delete User',
      isDangerous: true
    });

    if (!confirmed) return;

    // Optimistic deletion: immediately remove from UI for snappy feedback
    const previousUsers = [...this.users];
    this.users = this.users.filter(u => u._id !== user._id);
    this.cdr.markForCheck();

    this.userService.deleteUser(user._id).subscribe({
      next: () => {
        this.toastService.showSuccess(`User "${user.name}" was successfully deleted.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback state if backend returns an error
        this.users = previousUsers;
        const errMsg = err.error?.error?.message || 'Failed to delete user. Action reverted.';
        this.toastService.showError(errMsg);
        this.cdr.markForCheck();
      }
    });
  }
}

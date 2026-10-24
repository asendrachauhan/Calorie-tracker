import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly isOpen = signal(false);
  readonly options = signal<ConfirmDialogOptions>({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false
  });

  private resolveFn?: (confirmed: boolean) => void;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.options.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDangerous: false,
      ...options
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  handleConfirm(): void {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = undefined;
    }
  }

  handleCancel(): void {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = undefined;
    }
  }
}

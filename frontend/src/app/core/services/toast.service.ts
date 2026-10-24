import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private readonly toastsSignal = signal<ToastMessage[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration = 4000): void {
    const id = this.nextId++;
    const toast: ToastMessage = {
      id,
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'),
      message,
      duration
    };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  showSuccess(message: string, title = 'Success', duration = 4000): void {
    this.show(message, 'success', title, duration);
  }

  showError(message: string, title = 'Error', duration = 5000): void {
    this.show(message, 'error', title, duration);
  }

  showInfo(message: string, title = 'Info', duration = 4000): void {
    this.show(message, 'info', title, duration);
  }

  showWarning(message: string, title = 'Warning', duration = 4500): void {
    this.show(message, 'warning', title, duration);
  }

  remove(id: number): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}

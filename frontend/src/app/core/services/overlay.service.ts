import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Global singleton coordinator ensuring that only ONE dropdown,
 * datepicker, or popover menu is open across the entire screen at any time.
 */
@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  private activeIdSource = new Subject<string>();
  activeId$ = this.activeIdSource.asObservable();

  /**
   * Register that a popover/dropdown with the given ID has opened.
   * All other components listen to activeId$ and close if their ID does not match.
   */
  open(id: string): void {
    this.activeIdSource.next(id);
  }

  /**
   * Close all active popovers.
   */
  closeAll(): void {
    this.activeIdSource.next('');
  }
}

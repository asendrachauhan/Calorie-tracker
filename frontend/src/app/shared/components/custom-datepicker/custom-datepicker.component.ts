import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OverlayService } from '../../../core/services';
import { getLocalDateString } from '../../../core/utils/date.utils';

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-custom-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatepickerComponent),
      multi: true
    }
  ],
  templateUrl: './custom-datepicker.component.html',
  styleUrl: './custom-datepicker.component.css'
})
export class CustomDatepickerComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() placeholder = 'Select Date';
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() disabled = false;
  @Input() enforce30Days = false;
  @Output() dateChange = new EventEmitter<string>();

  private overlayService = inject(OverlayService);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  readonly componentId = `datepicker-${Math.random().toString(36).slice(2, 9)}`;
  private overlaySub?: Subscription;

  isOpen = false;
  placeAbove = false;
  alignRight = false;
  selectedDate: string = '';
  viewDate: Date = new Date();
  calendarDays: CalendarDay[] = [];

  readonly weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:pointerdown', ['$event'])
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.isOpen = false;
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.adjustPosition();
    }
  }

  ngOnInit(): void {
    this.initBounds();
    this.buildCalendar();

    // Listen for other popovers opening, close self if another opens
    this.overlaySub = this.overlayService.activeId$.subscribe(activeId => {
      if (activeId !== this.componentId && this.isOpen) {
        this.isOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.overlaySub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['minDate'] || changes['maxDate'] || changes['enforce30Days']) {
      this.initBounds();
      this.buildCalendar();
    }
  }

  private initBounds(): void {
    if (this.enforce30Days) {
      const today = new Date();
      this.maxDate = getLocalDateString(today);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      this.minDate = getLocalDateString(thirtyDaysAgo);
    }
  }

  get formattedDisplayDate(): string {
    return this.selectedDate;
  }

  toggleCalendar(event?: MouseEvent): void {
    if (this.disabled) return;
    event?.stopPropagation();

    if (!this.isOpen) {
      this.adjustPosition();
      this.isOpen = true;
      this.overlayService.open(this.componentId);
      if (this.selectedDate) {
        this.viewDate = new Date(this.selectedDate);
      } else {
        this.viewDate = new Date();
      }
      this.buildCalendar();
    } else {
      this.isOpen = false;
    }
  }

  get availableYears(): number[] {
    const currentYear = new Date().getFullYear();
    if (this.enforce30Days) {
      return [currentYear, currentYear - 1];
    }
    const years: number[] = [];
    const startYear = 1920;
    const endYear = currentYear + 2;
    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }
    return years;
  }

  onMonthSelect(monthIndex: number | string): void {
    const m = Number(monthIndex);
    this.viewDate = new Date(this.viewDate.getFullYear(), m, 1);
    this.buildCalendar();
    this.cdr.markForCheck();
  }

  onYearSelect(year: number | string): void {
    const y = Number(year);
    this.viewDate = new Date(y, this.viewDate.getMonth(), 1);
    this.buildCalendar();
    this.cdr.markForCheck();
  }

  private adjustPosition(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const popoverHeight = 310;
    const popoverWidth = 290;
    let spaceBelow = window.innerHeight - rect.bottom;
    let spaceAbove = rect.top;

    const scrollParent = el.closest('.modal-dialog-custom, .modal-content, .modal-body, .scroll-container');
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const parentBelow = parentRect.bottom - rect.bottom;
      const parentAbove = rect.top - parentRect.top;
      if (parentBelow < popoverHeight && parentAbove > parentBelow) {
        this.placeAbove = true;
        const spaceRight = window.innerWidth - rect.left;
        this.alignRight = spaceRight < popoverWidth;
        return;
      }
    }

    // Flip above if space below is tight AND there's more space above
    this.placeAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    // Align right if it would overflow right boundary of window
    const spaceRight = window.innerWidth - rect.left;
    this.alignRight = spaceRight < popoverWidth;
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDate(cell: CalendarDay): void {
    if (cell.isDisabled) return;
    this.selectedDate = cell.dateString;
    this.onChange(this.selectedDate);
    this.dateChange.emit(this.selectedDate);
    this.isOpen = false;
    this.buildCalendar();
  }

  selectToday(): void {
    const todayStr = getLocalDateString();
    if (this.isDateDisabled(todayStr)) return;
    this.selectedDate = todayStr;
    this.viewDate = new Date();
    this.onChange(this.selectedDate);
    this.dateChange.emit(this.selectedDate);
    this.isOpen = false;
    this.buildCalendar();
  }

  clearSelection(): void {
    this.selectedDate = '';
    this.onChange('');
    this.dateChange.emit('');
    this.isOpen = false;
    this.buildCalendar();
  }

  private isDateDisabled(dateStr: string): boolean {
    if (this.minDate && dateStr < this.minDate) return true;
    if (this.maxDate && dateStr > this.maxDate) return true;
    return false;
  }

  private buildCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];
    const days: CalendarDay[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = lastDayOfPrevMonth - i;
      const date = new Date(year, month - 1, dayNum);
      const dateStr = this.formatDate(date);
      days.push({
        date,
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        isDisabled: this.isDateDisabled(dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = this.formatDate(date);
      days.push({
        date,
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        isDisabled: this.isDateDisabled(dateStr)
      });
    }

    // Next month padding days to complete grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const date = new Date(year, month + 1, n);
      const dateStr = this.formatDate(date);
      days.push({
        date,
        dateString: dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        isDisabled: this.isDateDisabled(dateStr)
      });
    }

    this.calendarDays = days;
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  writeValue(value: string): void {
    this.selectedDate = value || '';
    if (this.selectedDate) {
      this.viewDate = new Date(this.selectedDate);
    }
    this.buildCalendar();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

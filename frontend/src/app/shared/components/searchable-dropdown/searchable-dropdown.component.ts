import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  ViewChild,
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

export interface DropdownOption<T = string | number> {
  label: string;
  value: T;
  subtext?: string;
  group?: string;
}

@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableDropdownComponent),
      multi: true
    }
  ],
  templateUrl: './searchable-dropdown.component.html',
  styleUrl: './searchable-dropdown.component.css'
})
export class SearchableDropdownComponent<T = string | number> implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() placeholder = '-- Select an option --';
  @Input() options: DropdownOption<T>[] = [];
  @Input() showSearch = true;
  @Input() disabled = false;
  @Output() selectionChange = new EventEmitter<T>();
  @Output() searchChange = new EventEmitter<string>();

  @ViewChild('searchInput') searchInputElement?: ElementRef<HTMLInputElement>;

  private overlayService = inject(OverlayService);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  readonly componentId = `dropdown-${Math.random().toString(36).slice(2, 9)}`;
  private overlaySub?: Subscription;

  isOpen = false;
  placeAbove = false;
  alignRight = false;
  searchTerm = '';
  selectedValue: T | null = null;
  selectedOption: DropdownOption<T> | null = null;
  filteredOptions: DropdownOption<T>[] = [];

  private onChange: (val: T | null) => void = () => {};
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
    this.filteredOptions = [...this.options];
    this.updateSelectedOption();

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
    if (changes['options']) {
      this.filterOptions();
      this.updateSelectedOption();
    }
  }

  toggleDropdown(event?: MouseEvent): void {
    if (this.disabled) return;
    event?.stopPropagation();

    if (!this.isOpen) {
      this.adjustPosition();
      this.isOpen = true;
      this.overlayService.open(this.componentId);
      this.searchTerm = '';
      this.filterOptions();
      setTimeout(() => {
        this.searchInputElement?.nativeElement.focus();
      }, 50);
    } else {
      this.isOpen = false;
    }
  }

  private adjustPosition(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const dropdownHeight = 220;

    let spaceBelow = window.innerHeight - rect.bottom;
    let spaceAbove = rect.top;

    // Detect if inside scrollable container (e.g. modal)
    const scrollParent = el.closest('.modal-dialog-custom, .modal-content, .modal-body, .scroll-container');
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const parentBelow = parentRect.bottom - rect.bottom;
      const parentAbove = rect.top - parentRect.top;
      if (parentBelow < dropdownHeight && parentAbove > parentBelow) {
        this.placeAbove = true;
        const spaceRight = window.innerWidth - rect.left;
        this.alignRight = spaceRight < 220;
        return;
      }
    }

    // Auto-adjust vertical flip based on viewport
    this.placeAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Auto-adjust horizontal alignment
    const spaceRight = window.innerWidth - rect.left;
    this.alignRight = spaceRight < 220;
  }

  onSearchChange(): void {
    this.filterOptions();
    this.searchChange.emit(this.searchTerm);
  }

  filterOptions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredOptions = [...this.options];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter(opt =>
      opt.label.toLowerCase().includes(term) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(term))
    );
  }

  selectOption(opt: DropdownOption<T>): void {
    this.selectedValue = opt.value;
    this.selectedOption = opt;
    this.onChange(this.selectedValue);
    this.selectionChange.emit(this.selectedValue);
    this.isOpen = false;
    this.searchTerm = '';
    this.filterOptions();
    this.cdr.markForCheck();
  }

  private updateSelectedOption(): void {
    this.selectedOption = this.options.find(o => o.value === this.selectedValue) || null;
  }

  writeValue(value: T | null): void {
    this.selectedValue = value;
    this.updateSelectedOption();
  }

  registerOnChange(fn: (val: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

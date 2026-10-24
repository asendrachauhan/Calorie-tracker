import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() type: 'users' | 'records' | 'food' | 'activity' | 'search' = 'records';
  @Input() title = 'No Data Available';
  @Input() description = 'There are no records to display at this time.';
  @Input() actionLabel?: string;
  @Input() actionLink?: string | string[];
  @Input() compact = false;
  @Output() actionClick = new EventEmitter<void>();
}

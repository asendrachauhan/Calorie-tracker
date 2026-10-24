import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.css'
})
export class LoadingStateComponent {
  @Input() message = 'Loading data...';
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}

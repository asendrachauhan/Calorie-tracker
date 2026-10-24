import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

export type BreadcrumbUrl = string | (string | number)[];

export interface BreadcrumbItem {
  label: string;
  url?: BreadcrumbUrl;
  queryParams?: Record<string, string | number | boolean>;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})
export class BreadcrumbComponent {
  private router = inject(Router);

  @Input() items: BreadcrumbItem[] = [];

  trackByItem(index: number, item: BreadcrumbItem): string {
    const urlStr = Array.isArray(item.url) ? item.url.join('/') : (item.url || '');
    return `${index}-${item.label}-${item.active}-${urlStr}`;
  }

  onNavigate(item: BreadcrumbItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!item.url || item.active) {
      return;
    }
    if (Array.isArray(item.url)) {
      this.router.navigate(item.url, { queryParams: item.queryParams });
    } else {
      this.router.navigate([item.url], { queryParams: item.queryParams });
    }
  }
}


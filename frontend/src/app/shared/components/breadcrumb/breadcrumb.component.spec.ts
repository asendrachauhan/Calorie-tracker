import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([{ path: '**', component: BreadcrumbComponent }])]
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('should create breadcrumb component', () => {
    expect(component).toBeTruthy();
  });

  it('should render breadcrumb items correctly', () => {
    component.items = [
      { label: 'Users', url: ['/users'] },
      { label: 'John Doe', active: true }
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.breadcrumb-link');
    const current = compiled.querySelector('.breadcrumb-current');

    expect(link?.textContent?.trim()).toBe('Users');
    expect(current?.textContent?.trim()).toBe('John Doe');
  });

  it('should navigate to target url when breadcrumb link is clicked', () => {
    const item: BreadcrumbItem = { label: 'Users', url: ['/users'] };
    component.items = [item, { label: 'Details', active: true }];
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.breadcrumb-link') as HTMLElement;
    expect(link).toBeTruthy();

    link.click();

    expect(router.navigate).toHaveBeenCalledWith(['/users'], { queryParams: undefined });
  });

  it('should handle string url navigation in onNavigate', () => {
    const item: BreadcrumbItem = { label: 'Users', url: '/users' };
    const event = new MouseEvent('click');
    vi.spyOn(event, 'preventDefault');

    component.onNavigate(item, event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/users'], { queryParams: undefined });
  });

  it('should not navigate if item has no url or is active', () => {
    const item: BreadcrumbItem = { label: 'Current', active: true };
    component.onNavigate(item);

    expect(router.navigate).not.toHaveBeenCalled();
  });
});

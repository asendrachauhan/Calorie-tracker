import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomDatepickerComponent } from './custom-datepicker.component';

describe('CustomDatepickerComponent', () => {
  let component: CustomDatepickerComponent;
  let fixture: ComponentFixture<CustomDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomDatepickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the custom datepicker component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle calendar popup when clicked', () => {
    expect(component.isOpen).toBe(false);
    component.toggleCalendar();
    expect(component.isOpen).toBe(true);
    component.toggleCalendar();
    expect(component.isOpen).toBe(false);
  });

  it('should enforce 30-day boundary when enforce30Days is true', () => {
    component.enforce30Days = true;
    component.ngOnInit();
    const today = new Date().toISOString().split('T')[0];
    expect(component.maxDate).toBe(today);
    expect(component.minDate).toBeDefined();

    // Check that a date from 35 days ago is disabled
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);
    const oldDateStr = oldDate.toISOString().split('T')[0];
    expect((component as any).isDateDisabled(oldDateStr)).toBe(true);
  });

  it('should select a day and emit dateChange event', () => {
    let emittedDate = '';
    component.dateChange.subscribe(d => (emittedDate = d));

    const todayStr = new Date().toISOString().split('T')[0];
    component.selectToday();

    expect(component.selectedDate).toBe(todayStr);
    expect(emittedDate).toBe(todayStr);
    expect(component.isOpen).toBe(false);
  });
});

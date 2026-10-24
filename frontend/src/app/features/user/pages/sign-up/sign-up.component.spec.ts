import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SignUpComponent } from './sign-up.component';
import { UserService } from '../../../../core/services';

interface MockUserService {
  createUser: ReturnType<typeof vi.fn>;
}

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let userServiceSpy: MockUserService;

  beforeEach(async () => {
    userServiceSpy = {
      createUser: vi.fn().mockReturnValue(of({
        _id: '123',
        name: 'James',
        weight: 75.7,
        height: 180,
        gender: 'male',
        dateOfBirth: '1988-06-15',
        age: 38,
        bmr: 1751.378
      }))
    };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: 'users', component: class {} }]),
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with invalid form', () => {
    expect(component.signUpForm.valid).toBe(false);
  });

  it('should validate name required', () => {
    const nameControl = component.signUpForm.controls.name;
    expect(nameControl.valid).toBe(false);
    nameControl.setValue('John Doe');
    expect(nameControl.valid).toBe(true);
  });

  it('should validate weight range (1-500)', () => {
    const weightControl = component.signUpForm.controls.weight;
    weightControl.setValue(0);
    expect(weightControl.valid).toBe(false);
    weightControl.setValue(75.5);
    expect(weightControl.valid).toBe(true);
    weightControl.setValue(501);
    expect(weightControl.valid).toBe(false);
  });

  it('should validate height range (30-300)', () => {
    const heightControl = component.signUpForm.controls.height;
    heightControl.setValue(20);
    expect(heightControl.valid).toBe(false);
    heightControl.setValue(180);
    expect(heightControl.valid).toBe(true);
  });

  it('should calculate live age and BMR preview when form is filled', () => {
    component.signUpForm.setValue({
      name: 'James',
      weight: 75.7,
      height: 180,
      gender: 'male',
      dateOfBirth: '1988-06-15'
    });

    expect(component.previewAge).toBeGreaterThan(0);
    expect(component.previewBmr).toBeGreaterThan(1000);
  });

  it('should call UserService.createUser on valid form submit', () => {
    component.signUpForm.setValue({
      name: 'James',
      weight: 75.7,
      height: 180,
      gender: 'male',
      dateOfBirth: '1988-06-15'
    });

    component.onSubmit();
    expect(userServiceSpy.createUser).toHaveBeenCalled();
  });
});

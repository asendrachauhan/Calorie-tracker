import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UserService, ToastService } from '../../../../core/services';
import { getLocalDateString } from '../../../../core/utils/date.utils';
import { CustomDatepickerComponent } from '../../../../shared/components/custom-datepicker/custom-datepicker.component';
import { SearchableDropdownComponent, DropdownOption } from '../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomDatepickerComponent,
    SearchableDropdownComponent,
    BreadcrumbComponent
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  router = inject(Router);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);

  todayDate = getLocalDateString();
  isSubmitting = false;

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Users', url: ['/users'] },
    { label: 'Register New User', active: true }
  ];

  readonly genderOptions: DropdownOption<'male' | 'female'>[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  previewAge: number | null = null;
  previewBmr: number | null = null;

  signUpForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    weight: [null as number | null, [Validators.required, Validators.min(1), Validators.max(500)]],
    height: [null as number | null, [Validators.required, Validators.min(30), Validators.max(300)]],
    gender: ['male' as 'male' | 'female', [Validators.required]],
    dateOfBirth: ['', [Validators.required]]
  });

  get f() {
    return this.signUpForm.controls;
  }

  ngOnInit(): void {
    this.titleService.setTitle('Net Calorie Tracker - Sign Up');
    this.signUpForm.reset({ gender: 'male' });
    this.previewAge = null;
    this.previewBmr = null;
  }

  constructor() {
    this.signUpForm.valueChanges.subscribe(() => {
      this.updatePreview();
      this.cdr.markForCheck();
    });
  }

  private updatePreview(): void {
    const { weight, height, gender, dateOfBirth } = this.signUpForm.value;
    if (weight && height && gender && dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      this.previewAge = age;

      if (gender === 'male') {
        this.previewBmr = 66.4730 + (13.7516 * Number(weight)) + (5.0033 * Number(height)) - (6.7550 * age);
      } else {
        this.previewBmr = 655.0955 + (9.5634 * Number(weight)) + (1.8496 * Number(height)) - (4.6756 * age);
      }
    } else {
      this.previewAge = null;
      this.previewBmr = null;
    }
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const formVal = this.signUpForm.value;
    this.userService.createUser({
      name: formVal.name!.trim(),
      weight: Number(formVal.weight),
      height: Number(formVal.height),
      gender: formVal.gender as 'male' | 'female',
      dateOfBirth: formVal.dateOfBirth!
    }).subscribe({
      next: (createdUser) => {
        this.isSubmitting = false;
        this.toastService.showSuccess(`User "${createdUser.name}" registered successfully!`);
        this.signUpForm.reset({ gender: 'male' });
        this.previewAge = null;
        this.previewBmr = null;
        this.cdr.markForCheck();
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.error?.message || 'Failed to create user. Please check your inputs.';
        this.toastService.showError(msg);
        this.cdr.markForCheck();
      }
    });
  }
}

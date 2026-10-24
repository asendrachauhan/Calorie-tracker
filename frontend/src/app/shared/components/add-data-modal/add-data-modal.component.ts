import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService, ActivityService, RecordService, ToastService } from '../../../core/services';
import { Food, Activity } from '../../../core/models';
import { getLocalDateString } from '../../../core/utils/date.utils';
import { CustomDatepickerComponent } from '../custom-datepicker/custom-datepicker.component';
import { SearchableDropdownComponent, DropdownOption } from '../searchable-dropdown/searchable-dropdown.component';

@Component({
  selector: 'app-add-data-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDatepickerComponent, SearchableDropdownComponent],
  templateUrl: './add-data-modal.component.html',
  styleUrl: './add-data-modal.component.css'
})
export class AddDataModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() initialTab: 'food' | 'activity' = 'food';
  @Input() userId = '';
  @Input() userName = '';
  @Input() userWeight = 70;
  @Input() initialDate = '';
  @Output() close = new EventEmitter<void>();
  @Output() dataSaved = new EventEmitter<{ type: 'food' | 'activity'; date: string }>();

  private foodService = inject(FoodService);
  private activityService = inject(ActivityService);
  private recordService = inject(RecordService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  private foodSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  private activitySearchTimeout: ReturnType<typeof setTimeout> | null = null;

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  activeTab: 'food' | 'activity' = 'food';
  date = '';

  // Tab 1: Food state
  foodGroupOptions: DropdownOption<string>[] = [];
  selectedFoodGroup: string = '';
  foods: Food[] = [];
  foodOptions: DropdownOption<number>[] = [];
  selectedFoodId: number | null = null;
  selectedFood: Food | null = null;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' = 'Lunch';
  portion = 1;
  calculatedFoodCalories = 0;

  readonly mealTypeOptions: DropdownOption<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>[] = [
    { label: 'Breakfast', value: 'Breakfast' },
    { label: 'Lunch', value: 'Lunch' },
    { label: 'Dinner', value: 'Dinner' },
    { label: 'Snack', value: 'Snack' }
  ];

  // Tab 2: Activity state
  activityCategoryOptions: DropdownOption<string>[] = [];
  selectedActivityCategory: string = '';
  activities: Activity[] = [];
  activityOptions: DropdownOption<string>[] = [];
  selectedActivityId: string | null = null;
  selectedActivity: Activity | null = null;
  durationMinutes = 30;
  calculatedActivityCalories = 0;

  isSaving = false;

  ngOnInit(): void {
    this.date = this.initialDate || getLocalDateString();
    this.loadFoodGroups();
    this.loadFoods();
    this.loadActivityCategories();
    this.loadActivities();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.activeTab = this.initialTab || 'food';
      this.date = this.initialDate || getLocalDateString();
      this.resetForm();
    }
    if (changes['initialTab'] && changes['initialTab'].currentValue) {
      this.activeTab = changes['initialTab'].currentValue;
    }
    if (changes['initialDate'] && this.initialDate) {
      this.date = this.initialDate;
    }
  }

  resetForm(): void {
    this.selectedFoodGroup = '';
    this.selectedFoodId = null;
    this.selectedFood = null;
    this.mealType = 'Lunch';
    this.portion = 1;
    this.calculatedFoodCalories = 0;

    this.selectedActivityCategory = '';
    this.selectedActivityId = null;
    this.selectedActivity = null;
    this.durationMinutes = 30;
    this.calculatedActivityCalories = 0;

    this.isSaving = false;
    this.loadFoods();
    this.loadActivities();
  }

  loadFoodGroups(): void {
    this.foodService.getFoodGroups().subscribe({
      next: (groups: string[]) => {
        this.foodGroupOptions = [
          { label: '-- All Food Groups --', value: '' },
          ...groups.map(g => ({ label: g, value: g }))
        ];
        this.cdr.markForCheck();
      },
      error: () => {
        this.foodGroupOptions = [{ label: '-- All Food Groups --', value: '' }];
      }
    });
  }

  loadFoods(group?: string): void {
    this.foodService.searchFoods('', group, 100).subscribe({
      next: (foods: Food[]) => {
        this.foods = foods;
        this.foodOptions = foods.map(f => ({
          label: f.name,
          value: f.foodId,
          subtext: `${f.calories} kcal | ${f.servingDescription} (${f.foodGroup})`
        }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.foods = [];
        this.foodOptions = [];
      }
    });
  }

  onFoodSearch(searchTerm: string): void {
    if (this.foodSearchTimeout) {
      clearTimeout(this.foodSearchTimeout);
    }
    this.foodSearchTimeout = setTimeout(() => {
      this.foodService.searchFoods(searchTerm.trim(), this.selectedFoodGroup || undefined, 100).subscribe({
        next: (searchResults: Food[]) => {
          this.foods = searchResults;
          this.foodOptions = searchResults.map(f => ({
            label: f.name,
            value: f.foodId,
            subtext: `${f.calories} kcal | ${f.servingDescription} (${f.foodGroup})`
          }));
          this.cdr.markForCheck();
        }
      });
    }, 250);
  }

  onActivitySearch(searchTerm: string): void {
    if (this.activitySearchTimeout) {
      clearTimeout(this.activitySearchTimeout);
    }
    this.activitySearchTimeout = setTimeout(() => {
      this.activityService.searchActivities(searchTerm.trim(), this.selectedActivityCategory || undefined, 100).subscribe({
        next: (searchResults: Activity[]) => {
          this.activities = searchResults;
          this.activityOptions = searchResults.map(a => ({
            label: a.activityName,
            value: a.activityId,
            subtext: `${a.specificMotion} (MET: ${a.metValue})`
          }));
          this.cdr.markForCheck();
        }
      });
    }, 250);
  }

  loadActivityCategories(): void {
    this.activityService.getActivityCategories().subscribe({
      next: (cats: string[]) => {
        this.activityCategoryOptions = [
          { label: '-- All Categories --', value: '' },
          ...cats.map(c => ({ label: c, value: c }))
        ];
        this.cdr.markForCheck();
      },
      error: () => {
        this.activityCategoryOptions = [{ label: '-- All Categories --', value: '' }];
      }
    });
  }

  loadActivities(category?: string): void {
    this.activityService.searchActivities('', category, 100).subscribe({
      next: (activities: Activity[]) => {
        this.activities = activities;
        this.activityOptions = activities.map(a => ({
          label: a.activityName,
          value: a.activityId,
          subtext: `${a.specificMotion} (MET: ${a.metValue})`
        }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.activities = [];
        this.activityOptions = [];
      }
    });
  }

  onFoodGroupChange(group: string): void {
    this.selectedFoodGroup = group;
    this.selectedFoodId = null;
    this.selectedFood = null;
    this.calculatedFoodCalories = 0;
    this.loadFoods(group);
  }

  onFoodSelected(foodId: number): void {
    this.selectedFoodId = foodId;
    this.selectedFood = this.foods.find(f => f.foodId === foodId) || null;
    this.updateFoodCaloriesPreview();
  }

  updateFoodCaloriesPreview(): void {
    if (!this.selectedFood || this.portion < 0.1) {
      this.calculatedFoodCalories = 0;
      return;
    }
    this.calculatedFoodCalories = Math.round(this.selectedFood.calories * this.portion * 10) / 10;
  }

  onActivityCategoryChange(category: string): void {
    this.selectedActivityCategory = category;
    this.selectedActivityId = null;
    this.selectedActivity = null;
    this.calculatedActivityCalories = 0;
    this.loadActivities(category);
  }

  onActivitySelected(activityId: string): void {
    this.selectedActivityId = activityId;
    this.selectedActivity = this.activities.find(a => a.activityId === activityId) || null;
    this.updateActivityCaloriesPreview();
  }

  updateActivityCaloriesPreview(): void {
    if (!this.selectedActivity || !this.userWeight || this.durationMinutes < 1) {
      this.calculatedActivityCalories = 0;
      return;
    }
    const cal = this.selectedActivity.metValue * this.userWeight * (this.durationMinutes / 60);
    this.calculatedActivityCalories = Math.round(cal * 10) / 10;
  }

  onDateSelected(newDate: string): void {
    this.date = newDate;
  }

  saveFoodEntry(): void {
    if (!this.selectedFoodId) {
      this.toastService.showWarning('Please select a food item.');
      return;
    }
    if (this.portion < 0.1) {
      this.toastService.showWarning('Portion multiplier must be at least 0.1.');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.recordService.addFoodEntry(this.userId, this.date, {
      foodId: this.selectedFoodId,
      portion: Number(this.portion),
      mealType: this.mealType
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
        this.dataSaved.emit({ type: 'food', date: this.date });
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.error?.message || 'Failed to save food entry.';
        this.toastService.showError(msg);
        this.cdr.markForCheck();
      }
    });
  }

  saveActivityEntry(): void {
    if (!this.selectedActivityId) {
      this.toastService.showWarning('Please select an activity.');
      return;
    }
    if (this.durationMinutes < 1) {
      this.toastService.showWarning('Duration must be at least 1 minute.');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.recordService.addActivityEntry(this.userId, this.date, {
      activityId: this.selectedActivityId,
      durationMinutes: Number(this.durationMinutes)
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
        this.dataSaved.emit({ type: 'activity', date: this.date });
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.error?.message || 'Failed to save activity entry.';
        this.toastService.showError(msg);
        this.cdr.markForCheck();
      }
    });
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }
}

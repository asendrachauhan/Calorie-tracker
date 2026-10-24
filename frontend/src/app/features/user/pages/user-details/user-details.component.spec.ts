import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { UserDetailsComponent } from './user-details.component';
import { UserService, RecordService, FoodService, ActivityService, ConfirmDialogService } from '../../../../core/services';
import { DailyRecord } from '../../../../core/models';

interface MockRecordService {
  getRecordByDate: ReturnType<typeof vi.fn>;
  removeFoodEntry: ReturnType<typeof vi.fn>;
  removeActivityEntry: ReturnType<typeof vi.fn>;
  addFoodEntry: ReturnType<typeof vi.fn>;
  addActivityEntry: ReturnType<typeof vi.fn>;
}

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  let recordServiceSpy: MockRecordService;

  const mockRecord: DailyRecord = {
    userId: 'u1',
    date: '2026-10-23',
    bmr: 1750,
    foodEntries: [
      { _id: 'f1', foodId: 1, foodName: 'Pizza', foodGroup: 'Fast Food', servingDescription: '1 slice', baseCalories: 300, portion: 2, mealType: 'Lunch', calculatedCalories: 600 }
    ],
    activityEntries: [
      { _id: 'a1', activityId: 'act1', activityName: 'Running', specificMotion: 'jogging', metValue: 7, userWeightKg: 75, durationMinutes: 30, calculatedCaloriesBurned: 262.5 }
    ],
    totalCaloriesIn: 600,
    totalCaloriesOut: 262.5,
    netCalories: 600 - 1750 - 262.5
  };

  beforeEach(async () => {
    const userServiceSpy = {
      getUserById: vi.fn().mockReturnValue(of({ _id: 'u1', name: 'James', weight: 75, height: 180, gender: 'male', dateOfBirth: '1988-06-15' }))
    };

    recordServiceSpy = {
      getRecordByDate: vi.fn().mockReturnValue(of(mockRecord)),
      removeFoodEntry: vi.fn().mockReturnValue(of({ ...mockRecord, foodEntries: [], totalCaloriesIn: 0, netCalories: -1750 - 262.5 })),
      removeActivityEntry: vi.fn().mockReturnValue(of({ ...mockRecord, activityEntries: [], totalCaloriesOut: 0, netCalories: 600 - 1750 })),
      addFoodEntry: vi.fn().mockReturnValue(of(mockRecord)),
      addActivityEntry: vi.fn().mockReturnValue(of(mockRecord))
    };

    const foodServiceSpy = {
      getFoodGroups: vi.fn().mockReturnValue(of([])),
      searchFoods: vi.fn().mockReturnValue(of([]))
    };

    const activityServiceSpy = {
      getActivityCategories: vi.fn().mockReturnValue(of([])),
      searchActivities: vi.fn().mockReturnValue(of([]))
    };

    const confirmDialogSpy = {
      confirm: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'u1']])),
            queryParamMap: of(new Map([['date', '2026-10-23']]))
          }
        },
        { provide: UserService, useValue: userServiceSpy },
        { provide: RecordService, useValue: recordServiceSpy },
        { provide: FoodService, useValue: foodServiceSpy },
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: ConfirmDialogService, useValue: confirmDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load daily record on init', () => {
    expect(recordServiceSpy.getRecordByDate).toHaveBeenCalledWith('u1', '2026-10-23');
    expect(component.record).toEqual(mockRecord);
  });

  it('should format date string into M/D/YYYY for display', () => {
    component.selectedDate = '2026-10-23';
    expect(component.displayFormattedDate).toBe('10/23/2026');
  });
});

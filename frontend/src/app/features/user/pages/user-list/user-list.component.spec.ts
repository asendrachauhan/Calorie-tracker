import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService, FoodService, ActivityService, RecordService, ConfirmDialogService } from '../../../../core/services';

interface MockUserService {
  getUsers: ReturnType<typeof vi.fn>;
  deleteUser: ReturnType<typeof vi.fn>;
}

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userServiceSpy: MockUserService;
  let confirmDialogSpy: { confirm: ReturnType<typeof vi.fn> };

  const mockUsers = [
    { _id: '1', name: 'James', weight: 75.7, height: 180, gender: 'male' as const, dateOfBirth: '1988-06-15', age: 38, bmr: 1751.378 },
    { _id: '2', name: 'Daniel', weight: 67.7, height: 167, gender: 'male' as const, dateOfBirth: '1996-03-20', age: 30, bmr: 1600.5 }
  ];

  beforeEach(async () => {
    userServiceSpy = {
      getUsers: vi.fn().mockReturnValue(of(mockUsers)),
      deleteUser: vi.fn().mockReturnValue(of({ message: 'User deleted', deletedRecords: 2 }))
    };

    confirmDialogSpy = {
      confirm: vi.fn().mockResolvedValue(true)
    };

    const foodServiceSpy = {
      getFoodGroups: vi.fn().mockReturnValue(of(['Fruits'])),
      searchFoods: vi.fn().mockReturnValue(of([]))
    };

    const activityServiceSpy = {
      getActivityCategories: vi.fn().mockReturnValue(of(['Running'])),
      searchActivities: vi.fn().mockReturnValue(of([]))
    };

    const recordServiceSpy = {
      addFoodEntry: vi.fn().mockReturnValue(of({})),
      addActivityEntry: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceSpy },
        { provide: ConfirmDialogService, useValue: confirmDialogSpy },
        { provide: FoodService, useValue: foodServiceSpy },
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: RecordService, useValue: recordServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load and display users from UserService', () => {
    expect(component.users.length).toBe(2);
    expect(userServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should filter users by search term', () => {
    component.debouncedSearchTerm = 'daniel';
    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].name).toBe('Daniel');
  });

  it('should open Add Data modal when openAddData is called', () => {
    component.openAddData(mockUsers[0]);
    expect(component.isModalOpen).toBe(true);
    expect(component.activeUser?.name).toBe('James');
  });

  it('should call UserService.deleteUser when confirmDelete is confirmed', async () => {
    await component.confirmDelete(mockUsers[0]);
    expect(confirmDialogSpy.confirm).toHaveBeenCalled();
    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('1');
  });
});

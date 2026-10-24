import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchableDropdownComponent, DropdownOption } from './searchable-dropdown.component';

describe('SearchableDropdownComponent', () => {
  let component: SearchableDropdownComponent<string>;
  let fixture: ComponentFixture<SearchableDropdownComponent<string>>;

  const mockOptions: DropdownOption<string>[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableDropdownComponent<string>);
    component = fixture.componentInstance;
    component.options = mockOptions;
    fixture.detectChanges();
  });

  it('should create the custom searchable dropdown component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown open and closed', () => {
    expect(component.isOpen).toBe(false);
    component.toggleDropdown();
    expect(component.isOpen).toBe(true);
    component.toggleDropdown();
    expect(component.isOpen).toBe(false);
  });

  it('should filter options based on search term', () => {
    component.searchTerm = 'female';
    component.filterOptions();
    expect(component.filteredOptions.length).toBe(1);
    expect(component.filteredOptions[0].value).toBe('female');
  });

  it('should select an option and emit selectionChange event', () => {
    let selectedVal: string | number | null = null;
    component.selectionChange.subscribe(val => (selectedVal = val));

    component.selectOption(mockOptions[0]);
    expect(component.selectedValue).toBe('male');
    expect(selectedVal).toBe('male');
    expect(component.isOpen).toBe(false);
  });
});

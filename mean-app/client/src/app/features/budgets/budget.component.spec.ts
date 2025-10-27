import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BudgetService } from '@core/services/budget.service';
import { BudgetComponent } from './budget.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('BudgetComponent', () => {
  let component: BudgetComponent;
  let fixture: ComponentFixture<BudgetComponent>;
  let budgetServiceMock: any;

  beforeEach(async () => {
    budgetServiceMock = {
      getAllBudgets: jasmine.createSpy('getAllBudgets').and.returnValue(of([{ amount: 1000, spent: 400 }])),
      createBudget: jasmine.createSpy('createBudget').and.returnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, BudgetComponent],
      providers: [{ provide: BudgetService, useValue: budgetServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch budgets on init', () => {
    expect(budgetServiceMock.getAllBudgets).toHaveBeenCalled();
    expect(component.budgets.length).toBeGreaterThan(0);
    expect(component.totalBudget).toBe(1000);
    expect(component.totalSpent).toBe(400);
    expect(component.remaining).toBe(600);
  });

  it('should call createBudget when saving new budget', () => {
    component.newBudget = { category: 'Food', amount: 500, month: '2025-10', description: 'Monthly food' };
    spyOn(window, 'alert');

    component.saveBudget();

    expect(budgetServiceMock.createBudget).toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should show alert if required fields are missing', () => {
    spyOn(window, 'alert');
    component.newBudget = { category: '', amount: null, month: '', description: '' };

    component.saveBudget();

    expect(window.alert).toHaveBeenCalledWith('Please fill Category, Amount and Month.');
    expect(budgetServiceMock.createBudget).not.toHaveBeenCalled();
  });
});

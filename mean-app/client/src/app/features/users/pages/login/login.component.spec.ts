import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { LoginComponent } from './login.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Mock AuthService
class MockAuthService {
  login(payload: { email: string; password: string }) {
    return of({ token: 'mock-token' });
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        LoginComponent
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    spyOn(router, 'navigate').and.stub();

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login and navigate on successful login', () => {
    const loginSpy = spyOn(authService, 'login').and.returnValue(of({ token: 'mock-token' }));
    spyOn(window, 'alert');

    component.loginForm.setValue({ email: 'test@example.com', password: '12345' });
    component.onSubmit();

    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: '12345' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(window.alert).toHaveBeenCalledWith('Welcome, test@example.com!');
  });

  it('should show alert if form invalid', () => {
    spyOn(window, 'alert');

    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();

    expect(window.alert).toHaveBeenCalledWith('Please fill out all fields');
  });
});

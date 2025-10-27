/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecurityComponent } from './security.component';
import { SettingsComponent } from '../settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';


describe('SecurityComponent', () => {
  let component: SecurityComponent;
  let fixture: ComponentFixture<SecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    (expect(component) as any).toBeTruthy();
  });
});

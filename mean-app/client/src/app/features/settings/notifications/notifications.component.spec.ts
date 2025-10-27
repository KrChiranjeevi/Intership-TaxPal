/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsComponent } from './notifications.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NotificationsService } from '../../../core/services/notifications.service';
import { of, throwError } from 'rxjs';


// Simple mock of NotificationsService
class MockNotificationsService {
  getNotifications() {
    return of([]); // default empty list
  }
  markAsRead(id: string) {
    return of({ ok: true });
  }
}

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationsComponent,
        HttpClientTestingModule   // 👈 ADD THIS LINE
      ],
      providers: [NotificationsService]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotificationsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripHistoryPage } from './trip-history.page';

describe('TripHistoryPage', () => {
  let component: TripHistoryPage;
  let fixture: ComponentFixture<TripHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TripHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

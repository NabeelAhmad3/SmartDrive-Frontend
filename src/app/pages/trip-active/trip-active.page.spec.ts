import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripActivePage } from './trip-active.page';

describe('TripActivePage', () => {
  let component: TripActivePage;
  let fixture: ComponentFixture<TripActivePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TripActivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { BackgroundGpsService } from './background-gps-service';

describe('BackgroundGpsService', () => {
  let service: BackgroundGpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundGpsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

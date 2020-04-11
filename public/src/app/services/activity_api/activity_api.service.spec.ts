import { TestBed } from '@angular/core/testing';

import { ActivitiesApiService } from './activities-api.service';

describe('ActivitiesApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ActivitiesApiService = TestBed.get(ActivitiesApiService);
    expect(service).toBeTruthy();
  });
});

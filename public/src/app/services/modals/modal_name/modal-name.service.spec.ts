import { TestBed } from '@angular/core/testing';

import { ModalNameService } from './modal-name.service';

describe('ModalNameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ModalNameService = TestBed.get(ModalNameService);
    expect(service).toBeTruthy();
  });
});

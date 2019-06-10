import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncTubeComponent } from './sync-tube.component';

describe('SyncTubeComponent', () => {
  let component: SyncTubeComponent;
  let fixture: ComponentFixture<SyncTubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SyncTubeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncTubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

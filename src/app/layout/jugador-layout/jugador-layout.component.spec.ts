import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugadorLayoutComponent } from './jugador-layout.component';

describe('JugadorLayoutComponent', () => {
  let component: JugadorLayoutComponent;
  let fixture: ComponentFixture<JugadorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugadorLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JugadorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

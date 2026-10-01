import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';

import { LoginComponent } from './login.component';

const mockAuthResponse = { token: 'fake.jwt.token', username: 'admin', role: 'ROLE_ADMIN' };

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let tokenService: TokenService;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    authServiceSpy.login.and.returnValue(of(mockAuthResponse));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    tokenService = TestBed.inject(TokenService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call login and store token', () => {
    component.form.setValue({ username: 'admin', password: 'Secret123' });
    component.onSubmit();
    fixture.detectChanges();
    expect(authServiceSpy.login).toHaveBeenCalledWith({ username: 'admin', password: 'Secret123' });
    expect(tokenService.getToken()).toBe('fake.jwt.token');
  });
});

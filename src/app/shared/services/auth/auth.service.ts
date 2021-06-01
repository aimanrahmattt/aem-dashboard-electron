import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginRequest } from '../../dto/user';
import { ApiService } from '../api/api.service';

export interface AuthState {
  loggedIn: boolean;
  tokenExpired: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private authState: AuthState = {
    loggedIn: false,
    tokenExpired: false
  };

  private onAuthChangedSubject = new BehaviorSubject<AuthState>(this.authState);
  private token: string = null;

  constructor(private api: ApiService) {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.authState.loggedIn = true;
      this.onAuthChangedSubject.next(this.authState);
    }
  }

  isLoggedIn() {
    return this.authState.loggedIn;
  }

  async login(loginRequest: LoginRequest) {
    try {
      const response = await this.api.login(loginRequest).toPromise();

      this.token = response;
      localStorage.setItem('token', this.token);

      this.authState = {
        loggedIn: true,
        tokenExpired: false
      };
      this.onAuthChangedSubject.next(this.authState);

      return true;
    } catch (error) {
      console.log('ERROR: Login', error)
      throw error;
    }
  }

  logout(tokenExpired: boolean = false) {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.authState.loggedIn = false;
    this.authState.tokenExpired = tokenExpired;
    this.onAuthChangedSubject.next(this.authState);
  }

  getToken() {
    return this.token;
  }

  get onAuthChange() {
    return this.onAuthChangedSubject;
  }

  onTokenExpired() {
    if (this.authState.loggedIn) {
      this.logout(true);
    }
  }
}

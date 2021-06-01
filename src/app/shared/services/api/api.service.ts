
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginRequest } from '../../dto/user';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly baseUrl: string = 'http://test-demo.aemenersol.com/api'; 

  constructor(private http: HttpClient) { }

  login(loginRequest: LoginRequest) {
    return this.http.post<any>(this.baseUrl + '/account/login', loginRequest);
  }  

  getDataFromDashboard(){
    return this.http.get<any>(this.baseUrl + '/dashboard');
  }
}

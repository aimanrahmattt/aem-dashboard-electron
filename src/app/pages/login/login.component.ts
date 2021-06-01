import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { LoginRequest } from 'src/app/shared/dto/user';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import PouchDB from 'node_modules/pouchdb';
import PouchDBFind from 'node_modules/pouchdb-find';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loginRequest: LoginRequest = {
    username: '',
    password: ''
  }

  loginError: boolean = false;
  pouchdb: any;

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder, private spinner: NgxSpinnerService) {
    this.pouchdb = new PouchDB("loginForm");
    this.saveCredentialToPouchdb();
    PouchDB.plugin(PouchDBFind);

    this.pouchdb.createIndex(
      {
        index: { fields: ['email'] }
      }
    );
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  async onLoginClicked() {
    this.spinner.show();

    this.loginRequest = {
      username: this.loginForm.get('username').value,
      password: this.loginForm.get('password').value
    }

    if(this.loginRequest.username) {
      let records = await this.getEmailSearched(this.loginRequest.username);
      let result = records.docs;

      if(result.length > 0) {
        console.log("h", result);
        
        if (this.loginRequest.username != result[0].email && this.loginRequest.password != result[0].password) {
          this.spinner.hide();
          this.loginError = true;
        } else {
          this.auth.login(this.loginRequest).then(
            res => {
              this.spinner.hide();
              this.router.navigate(['dashboard']);
            },
            err => {
              this.spinner.hide();
              console.log("FAILED: Login -> ", err);
              this.loginError = true;
            }
          );
        }
      }else {
        this.spinner.hide();
        this.loginError = true;
      }
    }
  }

  saveCredentialToPouchdb() {
    let pouchForm = {
      _id: new Date().toISOString(),
      email: "user@aemenersol.com",
      password: "Test@123"
    };

    this.pouchdb.put(pouchForm, function (result, error) {
      console.log(result);
    });
  }

  getEmailSearched(searchInput) {
    return this.pouchdb.find(
      {
        selector: {
          email: searchInput
        }
      }
    );
  }

}

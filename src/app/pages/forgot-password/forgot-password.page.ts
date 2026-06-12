import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormsModule]
})

export class ForgotPasswordPage {
  email = '';
  isLoading = false;
  submitted = false;
  errorMessage = '';

  constructor(private http: HttpClient) { }

  sendReset() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, {
      email: this.email
    }).subscribe({
      next: () => {
        this.submitted = true;
        this.isLoading = false;
      },
      error: (e) => {
        this.errorMessage = e.error?.error || 'Something went wrong';
        this.isLoading = false;
      }
    });
  }
}
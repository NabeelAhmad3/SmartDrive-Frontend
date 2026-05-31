import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner, IonIcon]
})
export class LoginPage {
  activeTab: 'login' | 'register' = 'login';

  loginEmail = '';
  loginPassword = '';
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async login() {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.loginEmail, this.loginPassword);
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      this.errorMessage = error?.error?.error || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async register() {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.register(
        this.registerName,
        this.registerEmail,
        this.registerPassword
      );
      this.successMessage = 'Account created! Please sign in.';
      setTimeout(() => {
        this.switchTab('login');
        this.loginEmail = this.registerEmail;
      }, 1500);
    } catch (error: any) {
      this.errorMessage = error?.error?.error || 'Registration failed. Try again.';
    } finally {
      this.isLoading = false;
    }
  }
}

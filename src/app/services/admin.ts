import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class Admin {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

  async getAllTrips(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/trips`,
        { headers: this.headers() })
    );
  }

  async getAllDrivers(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/drivers`,
        { headers: this.headers() })
    );
  }

  async getAnalytics(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/analytics`,
        { headers: this.headers() })
    );
  }

  async getOverspeedAlerts(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/overspeed/all`,
        { headers: this.headers() })
    );
  }

  async toggleDriverStatus(id: number, isActive: boolean): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/drivers/${id}/status`,
        { is_active: isActive },
        { headers: this.headers() })
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

  async startTrip(): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/trips/start`, {}, { headers: this.headers() })
    );
  }

  async endTrip(id: number, data: {
    totalDistance: number;
    maxSpeed: number;
    avgSpeed: number;
  }): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/trips/end/${id}`, data, { headers: this.headers() })
    );
  }

  async getRecentTrips(limit = 5): Promise<any[]> {
    const trips: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/trips/history`, { headers: this.headers() })
    );
    return trips.slice(0, limit);
  }

  async getOverspeedAlerts(): Promise<any[]> {
    const user = this.auth.getUser();
    if (!user) return [];
    try {
      const res: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/admin/overspeed/${user.id}`,
          { headers: this.headers() }
        )
      );
      return res;
    } catch (e) {
      return [];
    }
  }

  async getStats(): Promise<any> {
    const trips: any[] = await this.getRecentTrips(100);
    const completed = trips.filter(t => t.status === 'completed');
    const alerts = await this.getOverspeedAlerts();
    return {
      totalTrips: trips.length,
      totalDistance: completed.reduce((s, t) => s + (t.total_distance || 0), 0),
      avgSpeed: completed.length
        ? completed.reduce((s, t) => s + (t.avg_speed || 0), 0) / completed.length
        : 0,
      overspeedCount: alerts.length,
    };
  }
  async getTripGpsPoints(tripId: number): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/gps/trip/${tripId}`,
          { headers: this.headers() })
      );
      return res;
    } catch (e) {
      console.error('Failed to load GPS points:', e);
      return [];
    }
  }
}

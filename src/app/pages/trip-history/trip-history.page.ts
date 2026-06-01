import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon,
  IonSpinner, IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, downloadOutline, searchOutline,
  carOutline, chevronForwardOutline, closeOutline,
  playOutline, stopOutline, flagOutline
} from 'ionicons/icons';
import * as L from 'leaflet';
import { TripService } from 'src/app/services/trip';

@Component({
  selector: 'app-trip-history',
  templateUrl: './trip-history.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonSpinner,
    IonModal        
  ]
})
export class TripHistoryPage implements OnInit {

  allTrips: any[] = [];
  filteredTrips: any[] = [];
  isLoading = false;
  searchText = '';
  activeFilter = 'all';
  totalTrips = 0;
  totalDistance = '0.0';
  avgSpeed = '0';
  showDetail = false;
  selectedTrip: any = null;
  private detailMap: any = null;

  filters = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Completed', value: 'completed' },
    { label: 'Active', value: 'active' },
  ];

  constructor(
    private tripService: TripService,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline, downloadOutline, searchOutline,
      carOutline, chevronForwardOutline, closeOutline,
      playOutline, stopOutline, flagOutline
    });
  }

  async ngOnInit() {
    await this.loadTrips();
  }

  async loadTrips() {
    this.isLoading = true;
    try {
      this.allTrips = await this.tripService.getRecentTrips(100);
      this.calculateSummary();
      this.applyFilter();
    } catch (e) {
      console.error('Load trips error:', e);
    } finally {
      this.isLoading = false;
    }
  }

  calculateSummary() {
    const completed = this.allTrips.filter(t => t.status === 'completed');
    this.totalTrips = this.allTrips.length;
    this.totalDistance = completed
      .reduce((s, t) => s + (t.total_distance || 0), 0).toFixed(1);
    this.avgSpeed = completed.length
      ? Math.round(
        completed.reduce((s, t) => s + (t.avg_speed || 0), 0) / completed.length
      ).toString()
      : '0';
  }

  setFilter(value: string) {
    this.activeFilter = value;
    this.applyFilter();
  }

  applyFilter() {
    let trips = [...this.allTrips];
    const now = new Date();

    if (this.activeFilter === 'today') {
      trips = trips.filter(t =>
        new Date(t.start_time).toDateString() === now.toDateString()
      );
    } else if (this.activeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      trips = trips.filter(t => new Date(t.start_time) >= weekAgo);
    } else if (this.activeFilter === 'month') {
      trips = trips.filter(t => {
        const d = new Date(t.start_time);
        return d.getMonth() === now.getMonth()
          && d.getFullYear() === now.getFullYear();
      });
    } else if (this.activeFilter === 'completed') {
      trips = trips.filter(t => t.status === 'completed');
    } else if (this.activeFilter === 'active') {
      trips = trips.filter(t => t.status === 'active');
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      trips = trips.filter(t =>
        t.id?.toString().includes(q) || t.status?.includes(q)
      );
    }

    this.filteredTrips = trips;
  }

  getTripDuration(trip: any): string {
    if (!trip.start_time || !trip.end_time) return '--:--';
    const diff = new Date(trip.end_time).getTime()
      - new Date(trip.start_time).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  }

  viewTripDetail(trip: any) {
    this.selectedTrip = trip;
    this.showDetail = true;
    setTimeout(() => this.initDetailMap(trip), 500);
  }

  initDetailMap(trip: any) {
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }
    const el = document.getElementById('detail-map');
    if (!el) return;

    const lat = trip.start_lat || 31.5204;
    const lng = trip.start_lng || 74.3587;

    this.detailMap = L.map('detail-map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.detailMap);

    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#00D4FF',
      color: '#fff',
      weight: 2,
      fillOpacity: 1
    }).addTo(this.detailMap).bindPopup('Start').openPopup();
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedTrip = null;
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }
  }

  exportCSV() {
    const headers = [
      'Trip ID', 'Start Time', 'End Time',
      'Distance (km)', 'Max Speed', 'Avg Speed', 'Status'
    ];
    const rows = this.filteredTrips.map(t => [
      t.id, t.start_time, t.end_time || '',
      t.total_distance, t.max_speed, t.avg_speed, t.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartdrive_trips_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  goBack() {
    this.router.navigateByUrl('/dashboard');
  }
}
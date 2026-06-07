import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon,
  IonSpinner, IonModal
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { TripService } from 'src/app/services/trip';
import { PdfExportService } from 'src/app/services/pdf-export-service';

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
    private router: Router,
    private pdfExport: PdfExportService
  ) { }

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
  async exportPDF() {
    await this.pdfExport.exportDriverTrips(
      this.filteredTrips,
      {
        totalTrips: this.totalTrips,
        totalDistance: this.totalDistance,
        avgSpeed: this.avgSpeed,
      }
    );
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

  async initDetailMap(trip: any) {
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }

    const el = document.getElementById('detail-map');
    if (!el) return;
    this.detailMap = L.map('detail-map', { zoomControl: false })
      .setView([31.5204, 74.3587], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.detailMap);
    const points = await this.tripService.getTripGpsPoints(trip.id);

    if (points.length === 0) {
      console.warn('No GPS points found for trip', trip.id);
      return;
    }
    const latLngs = points.map((p: any) => L.latLng(p.lat, p.lng));

    L.polyline(latLngs, {
      color: '#00D4FF',
      weight: 4,
      opacity: 0.8
    }).addTo(this.detailMap);

    const startIcon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#22C55E;
           border:3px solid white;border-radius:50%;
           box-shadow:0 0 8px #22C55E;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const endIcon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#EF4444;
           border:3px solid white;border-radius:50%;
           box-shadow:0 0 8px #EF4444;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker(latLngs[0], { icon: startIcon })
      .addTo(this.detailMap)
      .bindPopup('Trip Start');

    L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
      .addTo(this.detailMap)
      .bindPopup('Trip End');
    this.detailMap.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30] });
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedTrip = null;
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }
  }

  goBack() {
    this.router.navigateByUrl('/dashboard');
  }
}
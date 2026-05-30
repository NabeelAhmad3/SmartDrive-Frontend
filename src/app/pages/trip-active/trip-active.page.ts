import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-trip-active',
  templateUrl: './trip-active.page.html',
  styleUrls: ['./trip-active.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class TripActivePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-trip-history',
  templateUrl: './trip-history.page.html',
  styleUrls: ['./trip-history.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class TripHistoryPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

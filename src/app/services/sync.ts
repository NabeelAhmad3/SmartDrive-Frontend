import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from './database';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private API = 'http://192.168.43.157:3000/api';

  constructor(private db: DatabaseService,
    private http: HttpClient) { }

  async startListening() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncNow();
      }
    });
  }

  async syncNow() {
    const points = await this.db.getUnsyncedPoints();
    if (points.length === 0) return;
    try {
      await this.http.post(`${this.API}/sync`, { points }).toPromise();
      const ids = points.map((p: any) => p.id);
      await this.db.markSynced(ids);
      console.log(`Synced ${ids.length} points`);
    } catch (e) {
      console.log('Sync failed, will retry when online');
    }
  }
}
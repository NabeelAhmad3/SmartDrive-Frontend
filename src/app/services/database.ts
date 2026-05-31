import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db: any = null;
  private isNative = Capacitor.isNativePlatform();
  private memoryStore: any[] = [];

  async initDB() {
    try {
      if (!this.isNative) {
        console.log('Browser mode - using memory store instead of SQLite');
        return;
      }

      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
      const sqlite = new SQLiteConnection(CapacitorSQLite);

      const isConn = (await sqlite.isConnection('smartdrive', false)).result;
      if (isConn) {
        this.db = await sqlite.retrieveConnection('smartdrive', false);
      } else {
        this.db = await sqlite.createConnection(
          'smartdrive', false, 'no-encryption', 1, false
        );
      }

      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS trips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          startTime INTEGER,
          endTime INTEGER,
          totalDistance REAL DEFAULT 0,
          maxSpeed REAL DEFAULT 0,
          avgSpeed REAL DEFAULT 0,
          status TEXT DEFAULT 'active'
        );
        CREATE TABLE IF NOT EXISTS gps_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tripId INTEGER,
          lat REAL,
          lng REAL,
          speed REAL,
          timestamp INTEGER,
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('SQLite Database initialized successfully');
    } catch (e) {
      console.error('Database init error:', e);
    }
  }

  async insertGpsPoint(tripId: number, lat: number,
                       lng: number, speed: number) {
    const point = {
      id: Date.now(),
      tripId, lat, lng, speed,
      timestamp: Date.now(),
      synced: 0
    };

    if (!this.isNative) {
      this.memoryStore.push(point);
      return;
    }

    if (!this.db) return;
    await this.db.run(
      `INSERT INTO gps_points (tripId,lat,lng,speed,timestamp,synced)
       VALUES (?,?,?,?,?,0)`,
      [tripId, lat, lng, speed, point.timestamp]
    );
  }

  async getUnsyncedPoints() {
    if (!this.isNative) {
      return this.memoryStore.filter(p => p.synced === 0);
    }

    if (!this.db) return [];
    const res = await this.db.query(
      `SELECT * FROM gps_points WHERE synced = 0`
    );
    return res.values || [];
  }

  async markSynced(ids: number[]) {
    if (!this.isNative) {
      this.memoryStore.forEach(p => {
        if (ids.includes(p.id)) p.synced = 1;
      });
      return;
    }

    if (!this.db || !ids.length) return;
    await this.db.run(
      `UPDATE gps_points SET synced=1 WHERE id IN (${ids.join(',')})`
    );
  }
}
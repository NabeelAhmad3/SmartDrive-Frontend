import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  async initDB() {
    this.db = await this.sqlite.createConnection(
      'smartdrive', false, 'no-encryption', 1, false
    );
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
  }

  async insertGpsPoint(tripId: number, lat: number,
                       lng: number, speed: number) {
    const ts = Date.now();
    await this.db.run(
      `INSERT INTO gps_points (tripId,lat,lng,speed,timestamp,synced)
       VALUES (?,?,?,?,?,0)`,
      [tripId, lat, lng, speed, ts]
    );
  }

  async getUnsyncedPoints() {
    const res = await this.db.query(
      `SELECT * FROM gps_points WHERE synced = 0`
    );
    return res.values || [];
  }

  async markSynced(ids: number[]) {
    await this.db.run(
      `UPDATE gps_points SET synced=1 WHERE id IN (${ids.join(',')})`
    );
  }
}
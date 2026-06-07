import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private async savePdf(doc: jsPDF, filename: string) {
    if (!Capacitor.isNativePlatform()) {
      doc.save(filename);
      return;
    }
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const base64 = doc.output('datauristring').split(',')[1];
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        text: 'SmartDrive Report',
        url: result.uri,
        dialogTitle: 'Save or Share Report',
      });

    } catch (e) {
      console.error('PDF save error on native:', e);
    }
  }

  private addHeader(doc: jsPDF, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartDrive  |  Admin Panel', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, pageWidth - 14, 14, { align: 'right' });
    doc.setTextColor(30, 41, 59);
  }

  private addFooter(doc: jsPDF) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  }

  private addSummaryCards(doc: jsPDF, cards: { label: string; value: string | number }[], startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const cardW = (pageWidth - 28 - (cards.length - 1) * 6) / cards.length;
    let x = 14;
    cards.forEach(card => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, startY, cardW, 22, 3, 3, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(String(card.value), x + cardW / 2, startY + 11, { align: 'center' });
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + cardW / 2, startY + 18, { align: 'center' });
      x += cardW + 6;
    });
    return startY + 30;
  }
  async exportDashboard(data: {
    totalDrivers: number;
    totalTrips: number;
    totalAlerts: number;
    activeTrips: number;
    totalDistance: string;
    drivers: any[];
    recentTrips: any[];
    speedAlerts: any[];
  }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.addHeader(doc, 'Full Dashboard Report');

    let y = 30;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); doc.text('Overview', 14, y); y += 6;

    y = this.addSummaryCards(doc, [
      { label: 'Total Drivers', value: data.totalDrivers },
      { label: 'Total Trips', value: data.totalTrips },
      { label: 'Speed Violations', value: data.totalAlerts },
      { label: 'Active Trips', value: data.activeTrips },
    ], y);

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); doc.text('Drivers', 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Email', 'Status']],
      body: data.drivers.map(d => [d.name, d.email, d.is_active ? 'Active' : 'Inactive']),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          hookData.cell.styles.textColor =
            hookData.cell.raw === 'Active' ? [16, 185, 129] : [239, 68, 68];
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 230) { doc.addPage(); this.addHeader(doc, 'Full Dashboard Report'); y = 30; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); doc.text('Recent Trips', 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Driver', 'Status', 'Distance (km)', 'Max Speed (km/h)', 'Date']],
      body: data.recentTrips.map(t => [
        `#${t.id}`, t.driver_name, t.status,
        Number(t.total_distance ?? 0).toFixed(1),
        Number(t.max_speed ?? 0).toFixed(0),
        new Date(t.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ]),
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 230) { doc.addPage(); this.addHeader(doc, 'Full Dashboard Report'); y = 30; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); doc.text('Speed Alerts', 14, y); y += 4;

    if (data.speedAlerts.length === 0) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('No speed alerts recorded.', 14, y + 6);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Driver', 'Speed (km/h)', 'Limit (km/h)', 'Over By', 'Trip', 'Date']],
        body: data.speedAlerts.map(a => [
          a.driver_name, a.speed, a.limit_set,
          `+${a.speed - a.limit_set} km/h`, `#${a.trip_id}`,
          new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        ]),
        styles: { fontSize: 8.5, cellPadding: 3 },
        headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 241, 242] },
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 3) {
            hookData.cell.styles.textColor = [185, 28, 28];
            hookData.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });
    }

    this.addFooter(doc);
    await this.savePdf(doc, `smartdrive-report-${this.dateStamp()}.pdf`);  // ✅ await
  }

  async exportDrivers(drivers: any[]) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.addHeader(doc, 'Drivers Report');
    let y = 30;
    y = this.addSummaryCards(doc, [
      { label: 'Total Drivers', value: drivers.length },
      { label: 'Active', value: drivers.filter(d => d.is_active).length },
      { label: 'Inactive', value: drivers.filter(d => !d.is_active).length },
    ], y);
    autoTable(doc, {
      startY: y,
      head: [['#', 'Name', 'Email', 'Status']],
      body: drivers.map((d, i) => [i + 1, d.name, d.email, d.is_active ? 'Active' : 'Inactive']),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          hookData.cell.styles.textColor =
            hookData.cell.raw === 'Active' ? [16, 185, 129] : [239, 68, 68];
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });
    this.addFooter(doc);
    await this.savePdf(doc, `smartdrive-drivers-${this.dateStamp()}.pdf`);
  }

  async exportTrips(trips: any[]) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    this.addHeader(doc, 'Trips Report');
    let y = 30;
    y = this.addSummaryCards(doc, [
      { label: 'Total Trips', value: trips.length },
      { label: 'Completed', value: trips.filter(t => t.status === 'completed').length },
      { label: 'Active', value: trips.filter(t => t.status === 'active').length },
      { label: 'Total Distance (km)', value: trips.reduce((s, t) => s + (t.total_distance || 0), 0).toFixed(1) },
    ], y);
    autoTable(doc, {
      startY: y,
      head: [['Trip ID', 'Driver', 'Status', 'Distance (km)', 'Max Speed (km/h)', 'Date']],
      body: trips.map(t => [
        `#${t.id}`, t.driver_name, t.status,
        Number(t.total_distance ?? 0).toFixed(1),
        Number(t.max_speed ?? 0).toFixed(0),
        new Date(t.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    this.addFooter(doc);
    await this.savePdf(doc, `smartdrive-trips-${this.dateStamp()}.pdf`);
  }

  async exportAlerts(alerts: any[]) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.addHeader(doc, 'Speed Alerts Report');
    let y = 30;
    if (alerts.length === 0) {
      doc.setFontSize(11); doc.setTextColor(100, 116, 139);
      doc.text('No speed alerts recorded.', 14, y + 10);
      this.addFooter(doc);
      await this.savePdf(doc, `smartdrive-alerts-${this.dateStamp()}.pdf`);
      return;
    }
    const maxOver = Math.max(...alerts.map(a => a.speed - a.limit_set));
    y = this.addSummaryCards(doc, [
      { label: 'Total Alerts', value: alerts.length },
      { label: 'Unique Drivers', value: new Set(alerts.map(a => a.driver_name)).size },
      { label: 'Max Over Limit (km/h)', value: `+${maxOver}` },
    ], y);
    autoTable(doc, {
      startY: y,
      head: [['Driver', 'Speed (km/h)', 'Limit (km/h)', 'Over By', 'Trip ID', 'Date']],
      body: alerts.map(a => [
        a.driver_name, a.speed, a.limit_set,
        `+${a.speed - a.limit_set} km/h`, `#${a.trip_id}`,
        new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [185, 28, 28], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          hookData.cell.styles.textColor = [185, 28, 28];
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });
    this.addFooter(doc);
    await this.savePdf(doc, `smartdrive-alerts-${this.dateStamp()}.pdf`);
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async exportDriverTrips(trips: any[], summary: {
    totalTrips: number;
    totalDistance: string;
    avgSpeed: string;
  }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.addHeader(doc, 'My Trip History');

    let y = 30;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Trip Summary', 14, y);
    y += 6;

    y = this.addSummaryCards(doc, [
      { label: 'Total Trips', value: summary.totalTrips },
      { label: 'Total Distance', value: `${summary.totalDistance} km` },
      { label: 'Avg Speed', value: `${summary.avgSpeed} km/h` },
      { label: 'Completed', value: trips.filter(t => t.status === 'completed').length },
    ], y);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('All Trips', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Trip ID', 'Date', 'Start Time', 'End Time', 'Distance', 'Max Speed', 'Avg Speed', 'Status']],
      body: trips.map(t => [
        `#${t.id}`,
        t.start_time
          ? new Date(t.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '',
        t.start_time
          ? new Date(t.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : '',
        t.end_time
          ? new Date(t.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : 'Ongoing',
        `${Number(t.total_distance ?? 0).toFixed(1)} km`,
        `${Number(t.max_speed ?? 0).toFixed(0)} km/h`,
        `${Number(t.avg_speed ?? 0).toFixed(0)} km/h`,
        t.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 7) {
          const val = hookData.cell.raw as string;
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.textColor =
            val === 'completed' ? [16, 185, 129] : [59, 130, 246];
        }
      },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc);
    await this.savePdf(doc, `smartdrive-my-trips-${this.dateStamp()}.pdf`);
  }
}
import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'table-closed' | 'table-ready' | 'dealer-message';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public readonly notification = signal<Notification | null>(null);

  showError(message: string) {
    const casinoMessage = this.formatCasinoMessage(message);
    this.notification.set({ message: casinoMessage, type: 'table-closed' });
    setTimeout(() => this.notification.set(null), 6000);
  }

  private formatCasinoMessage(message: string): string {
    const messagePatterns = {
      'Please enter a room code': 'Please enter a table number to join',
      'Room does not exist': 'Table not found in the casino',
      'Only the host can reset': 'Only the dealer can reset the table',
      'unexpected error': 'Casino servers are busy'
    };

    for (const [pattern, response] of Object.entries(messagePatterns)) {
      if (message.includes(pattern)) {
        return response;
      }
    }

    return 'Table temporarily unavailable';
  }
}

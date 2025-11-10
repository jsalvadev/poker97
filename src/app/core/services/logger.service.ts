import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private isDevelopment = !environment.production;

  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Always log errors, even in production
    console.error(...args);
  }

  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }
}

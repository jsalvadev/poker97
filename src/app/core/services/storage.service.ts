import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

  getItem(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }

  clear(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
}

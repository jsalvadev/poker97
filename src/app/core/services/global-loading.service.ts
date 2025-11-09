import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalLoadingService {
  public readonly loading = signal<boolean>(false);

  public show(): void {
    this.loading.set(true);
  }

  public hide(): void {
    this.loading.set(false);
  }
}

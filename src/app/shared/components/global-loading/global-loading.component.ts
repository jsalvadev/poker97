import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalLoadingService } from '../../../core/services/global-loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (globalLoadingService.loading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 border-3 border-gray-300 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
          <span class="text-emerald-400 text-sm font-medium">Loading...</span>
        </div>
      </div>
    }
  `
})
export class GlobalLoadingComponent {
  public globalLoadingService = inject(GlobalLoadingService);
}

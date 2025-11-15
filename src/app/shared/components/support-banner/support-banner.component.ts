import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-support-banner',
  standalone: true,
  imports: [CommonModule, TablerIconsModule],
  templateUrl: './support-banner.component.html',
  styleUrl: './support-banner.component.css'
})
export class SupportBannerComponent {
  readonly dismissed = signal(false);
  readonly showFeedbackForm = signal(false);

  dismiss(): void {
    this.dismissed.set(true);
    localStorage.setItem('poker97_banner_dismissed', 'true');
  }

  showFeedback(): void {
    this.showFeedbackForm.set(true);
  }

  constructor() {
    const wasDismissed = localStorage.getItem('poker97_banner_dismissed');
    if (wasDismissed === 'true') {
      this.dismissed.set(true);
    }
  }
}

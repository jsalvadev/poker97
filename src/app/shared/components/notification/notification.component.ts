import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notificationService.notification(); as notification) {
      <div class="casino-notification animate-fadeIn">
        <div class="notification-content">
          <div class="suits">♠️ ♥️</div>
          <span class="message">{{ notification.message }}</span>
          <div class="suits">♣️ ♦️</div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .casino-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.8rem 3rem;
        border-radius: 4px;
        min-width: 340px;
        text-align: center;
        font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', monospace;
        background: linear-gradient(145deg, #1b472d, #0d3321);
        color: #ffffff;
        border: 1px solid #2d724a;
        box-shadow: 0 2px 8px rgba(13, 51, 33, 0.4);

        z-index: 1000;
      }

      .notification-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        font-size: 1.1em;
      }

      .message {
        font-weight: 600;
        letter-spacing: 0.4px;
      }

      .suits {
        font-size: 1.1em;
      }
    `
  ]
})
export class NotificationComponent {
  public readonly notificationService = inject(NotificationService);
}

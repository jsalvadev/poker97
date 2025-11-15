import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { RoomConfig } from '../../core/types/room.types';
import { RoomManagementService } from '../../core/services/room-management.service';
import { HelpModalComponent } from '../../shared/components/help-modal/help-modal.component';
import { TablerIconComponent } from 'angular-tabler-icons';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { SupportBannerComponent } from '../../shared/components/support-banner/support-banner.component';

@Component({
  selector: 'app-welcome',
  imports: [FormsModule, HelpModalComponent, TablerIconComponent, SocialLinksComponent, SupportBannerComponent],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  public showHelpModal = signal(false);
  public estimationType = signal<'fibonacci' | 't-shirt'>('fibonacci');

  private router = inject(Router);
  private roomManagementService = inject(RoomManagementService);

  public async createRoom() {
    try {
      const { roomId, hostId } = await this.roomManagementService.createRoom(this.estimationType());

      this.navigateToRoom({
        roomId,
        userId: hostId,
        isHost: true,
        isSpectator: false,
        estimationType: this.estimationType()
      });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }

  private navigateToRoom(config: RoomConfig): void {
    this.router.navigate(['/room/' + config.roomId], { state: config });
  }
}

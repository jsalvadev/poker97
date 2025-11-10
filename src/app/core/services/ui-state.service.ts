import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoomManagementService } from './room-management.service';
import { ParticipantService } from './participant.service';

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private router = inject(Router);
  private roomManagementService = inject(RoomManagementService);
  private participantService = inject(ParticipantService);
  private destroyRef = inject(DestroyRef);

  public copyInviteLink(roomId: string): void {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/room/${roomId}`;

    if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator
        .share({
          title: 'Join my planning poker room',
          text: 'Click to join my planning poker session',
          url: inviteLink
        })
        .catch(() => {
          this.copyToClipboard(inviteLink);
        });
      return;
    }

    this.copyToClipboard(inviteLink);
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        this.fallbackCopyMethod(text);
      });
      return;
    }

    this.fallbackCopyMethod(text);
  }

  private fallbackCopyMethod(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      textArea.contentEditable = 'true';
      textArea.readOnly = false;

      const range = document.createRange();
      range.selectNodeContents(textArea);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }

    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy method failed:', err);
    }

    document.body.removeChild(textArea);
  }

  public setTemporaryState(callback: (value: boolean) => void, duration = 2000): void {
    callback(true);
    setTimeout(() => callback(false), duration);
  }

  public async leaveRoom(roomId: string, userId: string, isHost: boolean): Promise<void> {
    if (isHost) {
      await this.roomManagementService.deleteRoom(roomId, userId).catch(console.error);
    } else {
      await this.participantService.removeParticipant(roomId, userId);
    }
    this.router.navigate(['/welcome']);
  }

  public setupRoomDeletionListener(roomId: string): void {
    this.roomManagementService.listenToRoomDeletion(roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/welcome']);
        },
        error: (error) => {
          console.error('Error listening to room deletion:', error);
          this.router.navigate(['/welcome']);
        }
      });
  }
}

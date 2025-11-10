import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoomManagementService } from '../services/room-management.service';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = async route => {
  const router = inject(Router);
  const roomManagementService = inject(RoomManagementService);
  const storageService = inject(StorageService);
  const navigationState = router.getCurrentNavigation()?.extras.state;

  if (navigationState && navigationState['roomId'] && navigationState['userId']) {
    const storedConfig = storageService.getItem('roomConfig');
    if (storedConfig) {
      try {
        const sessionState = JSON.parse(storedConfig) as { roomId: string; userId: string; isHost: boolean };
        if (sessionState.roomId === navigationState['roomId'] && sessionState.userId === navigationState['userId']) {
          try {
            await roomManagementService.rejoinRoom(sessionState.roomId, sessionState.userId, false);
            return true;
          } catch (error) {
            console.warn('Failed to rejoin room, continuing with normal flow', error);
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored room config', e);
      }
    }
    return true;
  }

  const roomId = route.paramMap.get('roomId');
  if (roomId) {
    try {
      const { userId, estimationType } = await roomManagementService.joinRoom(roomId, false);

      const roomConfig = {
        roomId,
        userId,
        isHost: false,
        isSpectator: false,
        estimationType
      };

      history.replaceState(roomConfig, '');

      storageService.setItem('roomConfig', JSON.stringify(roomConfig));

      return true;
    } catch (error) {
      console.error('Failed to join room via URL:', error);
    }
  }

  router.navigate(['/welcome']);
  return false;
};

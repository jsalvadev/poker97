import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

import { type Participant } from '../types/participant.types';
import { FirebaseConnectionService } from './firebase-connection.service';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private firebaseService = inject(FirebaseConnectionService);

  public getActiveParticipantsCount(roomId: string): Observable<number> {
    return this.firebaseService.createObservable(this.firebaseService.getParticipantsPath(roomId), snapshot => {
      if (!snapshot.exists()) return 0;

      const participants = snapshot.val();
      return Object.values(participants).filter(participant => !(participant as Participant).isSpectator).length;
    });
  }

  public async removeParticipant(roomId: string, userId: string): Promise<void> {
    await this.firebaseService.setData(this.firebaseService.getParticipantPath(roomId, userId), null);
  }

  public listenToParticipantRemoval(roomId: string, userId: string): Observable<void> {
    return this.firebaseService
      .createObservable(this.firebaseService.getParticipantPath(roomId, userId), snapshot => {
        if (!snapshot.exists()) {
          return void 0;
        }
        return null;
      })
      .pipe(
        filter(value => value !== null),
        map(() => undefined)
      );
  }
}

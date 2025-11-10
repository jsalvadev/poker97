import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { FirebaseConnectionService } from './firebase-connection.service';
import { RoomAuthorizationService } from './room-authorization.service';

interface ParticipantData {
  isHost: boolean;
  isSpectator: boolean;
  vote: number | null;
}

interface RoomData {
  forceReveal?: boolean;
}

interface ParticipantData {
  isHost: boolean;
  isSpectator: boolean;
  vote: number | null;
  lastActive?: number;
}

type Participants = Record<string, ParticipantData>;
type ParticipantUpdates = Record<string, ParticipantData['vote']>;

@Injectable({
  providedIn: 'root'
})
export class VotingService {
  private firebaseService = inject(FirebaseConnectionService);
  private authService = inject(RoomAuthorizationService);

  public async addVote(roomId: string, userId: string, vote: number): Promise<void> {
    const hasVoted = await this.authService.hasUserVoted(roomId, userId);

    if (hasVoted) return;

    await this.firebaseService.updateData(this.firebaseService.getParticipantPath(roomId, userId), { vote });
  }

  public async removeVote(roomId: string, userId: string): Promise<void> {
    await this.firebaseService.updateData(this.firebaseService.getParticipantPath(roomId, userId), { vote: null });
  }

  public async updateSpectatorStatus(roomId: string, userId: string, isSpectator: boolean): Promise<void> {
    const updates = isSpectator ? { isSpectator, vote: null } : { isSpectator };

    await this.firebaseService.updateData(this.firebaseService.getParticipantPath(roomId, userId), updates);
  }

  public getVotedParticipantsCount(roomId: string): Observable<number> {
    return this.firebaseService.createObservable(this.firebaseService.getParticipantsPath(roomId), snapshot => {
      if (!snapshot.exists()) return 0;

      const participants: Participants = snapshot.val();
      return Object.values(participants).filter(participant => participant.vote !== null && participant.vote > 0)
        .length;
    });
  }

  public getVotes(roomId: string): Observable<number[]> {
    return this.firebaseService.createObservable(this.firebaseService.getParticipantsPath(roomId), snapshot => {
      if (!snapshot.exists()) return [];

      const participants: Participants = snapshot.val();
      return Object.values(participants)
        .filter(participant => !participant.isSpectator)
        .map(participant => participant.vote)
        .filter(vote => vote !== null);
    });
  }

  public getAllVotes(roomId: string): Observable<(number | null)[]> {
    return this.firebaseService.createObservable(this.firebaseService.getParticipantsPath(roomId), snapshot => {
      if (!snapshot.exists()) return [];

      const participants: Participants = snapshot.val();
      return Object.values(participants)
        .filter(participant => !participant.isSpectator)
        .map(participant => participant.vote);
    });
  }

  public calcAverageVote(roomId: string): Observable<number> {
    return this.getVotes(roomId).pipe(map(votes => {
      if (!votes.length) return 0;
      return votes.reduce((a, b) => a + b, 0) / votes.length;
    }));
  }

  public async resetVotes(roomId: string, userId: string): Promise<void> {
    const isHost = await this.authService.checkIsHost(roomId, userId);

    if (!isHost) {
      throw new Error('Only the host can reset votes');
    }

    const participants: Participants = await this.firebaseService.getData(
      this.firebaseService.getParticipantsPath(roomId)
    );

    if (!participants) return;

    const updates: ParticipantUpdates = {};

    Object.entries(participants).forEach(([participantId, participant]) => {
      if (!participant.isSpectator) {
        updates[`${participantId}/vote`] = null;
      }
    });

    await this.firebaseService.updateData(`rooms/${roomId}`, { forceReveal: false });
    await this.firebaseService.updateData(this.firebaseService.getParticipantsPath(roomId), updates);
  }

  public getUserVote(roomId: string, userId: string): Observable<number | null> {
    return this.firebaseService.createObservable(this.firebaseService.getVotePath(roomId, userId), snapshot =>
      snapshot.exists() ? snapshot.val() : null
    );
  }

  public async forceRevealCards(roomId: string, userId: string): Promise<void> {
    const isHost = await this.authService.checkIsHost(roomId, userId);

    if (!isHost) {
      throw new Error('Only the host can force reveal cards');
    }

    await this.firebaseService.updateData(`rooms/${roomId}`, { forceReveal: true });
  }

  public getForceRevealStatus(roomId: string): Observable<boolean> {
    return this.firebaseService.createObservable(`rooms/${roomId}`, snapshot => {
      if (!snapshot.exists()) return false;

      const roomData: RoomData = snapshot.val();
      return roomData.forceReveal === true;
    });
  }

  public async checkIsHost(roomId: string, userId: string): Promise<boolean> {
    try {
      const participant = await this.firebaseService.getData(this.firebaseService.getParticipantPath(roomId, userId));
      return participant?.isHost === true;
    } catch (error) {
      console.error('Error checking if user is host:', error);
      return false;
    }
  }

  public async getRoomParticipants(roomId: string): Promise<Record<string, ParticipantData> | null> {
    try {
      return await this.firebaseService.getData(this.firebaseService.getParticipantsPath(roomId));
    } catch (error) {
      console.error('Error getting room participants:', error);
      return null;
    }
  }
}

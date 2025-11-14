import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { VotingService } from './voting.service';
import { ParticipantService } from './participant.service';
import { ConfettiService } from './confetti.service';
import { RoomManagementService } from './room-management.service';
import { FIBONACCI_NUMBERS, TSHIRT_SIZES } from '../constants/estimation.constants';

@Injectable({
  providedIn: 'root'
})
export class VoteStateService {
  private votingService = inject(VotingService);
  private participantService = inject(ParticipantService);
  private confettiService = inject(ConfettiService);
  private roomManagementService = inject(RoomManagementService);
  private confettiTriggeredFor: Record<string, string> = {};

  public getVoteState(roomId: string): Observable<{
    votes: number[];
    usersConnectedCount: number;
    usersVotedCount: number;
    averageVote: number | string;
    forceReveal: boolean;
  }> {
    const votes$ = this.votingService.getVotes(roomId);
    const usersConnectedCount$ = this.participantService.getActiveParticipantsCount(roomId);
    const usersVotedCount$ = this.votingService.getVotedParticipantsCount(roomId);
    const forceReveal$ = this.votingService.getForceRevealStatus(roomId);

    return combineLatest([votes$, usersConnectedCount$, usersVotedCount$, forceReveal$]).pipe(
      switchMap(async ([votes, connected, voted, forceReveal]: [number[], number, number, boolean]) => {
        if (connected === voted && connected > 0 && this.checkUnanimousVotes(votes)) {
          this.triggerConfettiOnce(roomId, votes);
        } else if (votes.length === 0 || voted === 0) {
          this.resetConfettiState(roomId);
        }
        const statistic = await this.calculateStatistic(roomId, votes);
        return {
          votes,
          usersConnectedCount: connected,
          usersVotedCount: voted,
          averageVote: statistic,
          forceReveal
        };
      })
    );
  }

  public async handleVote(roomId: string, userId: string, vote: number | null): Promise<void> {
    if (vote === null) {
      await this.votingService.removeVote(roomId, userId);
      return;
    }

    // Validate vote value
    const estimationType = await this.roomManagementService.getRoomEstimationType(roomId);
    const validVotes = estimationType === 'fibonacci'
      ? Array.from(FIBONACCI_NUMBERS)
      : Array.from({ length: TSHIRT_SIZES.length }, (_, i) => i + 1);

    if (!validVotes.includes(vote)) {
      throw new Error(`Invalid vote value: ${vote}. Expected one of: ${validVotes.join(', ')}`);
    }

    await this.votingService.addVote(roomId, userId, vote);
  }

  public resetConfettiState(roomId: string): void {
    delete this.confettiTriggeredFor[roomId];
  }

  public getVoteStateForUI(roomId: string): Observable<{
    votes: (number | null)[];
    usersConnectedCount: number;
    usersVotedCount: number;
    averageVote: number | string;
    forceReveal: boolean;
    votesWithUserIds: Array<{ vote: number | null; userId: string }>;
  }> {
    const allVotes$ = this.votingService.getAllVotes(roomId);
    const allVotesWithUserIds$ = this.votingService.getAllVotesWithUserIds(roomId);
    const usersConnectedCount$ = this.participantService.getActiveParticipantsCount(roomId);
    const usersVotedCount$ = this.votingService.getVotedParticipantsCount(roomId);
    const forceReveal$ = this.votingService.getForceRevealStatus(roomId);

    return combineLatest([allVotes$, allVotesWithUserIds$, usersConnectedCount$, usersVotedCount$, forceReveal$]).pipe(
      switchMap(async ([votes, votesWithUserIds, connected, voted, forceReveal]: [(number | null)[], Array<{ vote: number | null; userId: string }>, number, number, boolean]) => {
        const numericVotes = votes.filter(v => v !== null) as number[];
        if (connected === voted && connected > 0 && this.checkUnanimousVotes(numericVotes)) {
          this.triggerConfettiOnce(roomId, numericVotes);
        } else if (votes.length === 0 || voted === 0) {
          this.resetConfettiState(roomId);
        }
        const statistic = await this.calculateStatistic(roomId, numericVotes);
        return {
          votes,
          usersConnectedCount: connected,
          usersVotedCount: voted,
          averageVote: statistic,
          forceReveal,
          votesWithUserIds
        };
      })
    );
  }

  public hasNullVotes(votes: (number | null)[]): boolean {
    return votes.some(v => v === null);
  }

  private checkUnanimousVotes(votes: number[]): boolean {
    const validVotes = votes.filter(vote => typeof vote === 'number');
    return validVotes.length > 1 && validVotes.every(vote => vote === validVotes[0]);
  }

  private triggerConfettiOnce(roomId: string, votes: number[]): void {
    const voteSignature = votes.sort().join(',');
    const lastTriggeredFor = this.confettiTriggeredFor[roomId];

    if (lastTriggeredFor !== voteSignature) {
      this.confettiService.trigger();
      this.confettiTriggeredFor[roomId] = voteSignature;
    }
  }

  private calculateAverage(votes: number[]): number {
    if (!votes.length) return 0;
    return votes.reduce((a, b) => a + b, 0) / votes.length;
  }

  private calculateMode(votes: number[]): number {
    if (!votes.length) return 0;

    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let mode = 0;

    // Count frequency of each vote
    for (const vote of votes) {
      frequency[vote] = (frequency[vote] || 0) + 1;
      if (frequency[vote] > maxFreq || (frequency[vote] === maxFreq && vote > mode)) {
        maxFreq = frequency[vote];
        mode = vote;
      }
    }

    return mode;
  }

  private numberToTshirtSize(vote: number): string {
    const index = vote - 1;
    return index >= 0 && index < TSHIRT_SIZES.length ? TSHIRT_SIZES[index] : 'XS';
  }

  private async calculateStatistic(roomId: string, votes: number[]): Promise<number | string> {
    if (!votes.length) {
      try {
        const estimationType = await this.roomManagementService.getRoomEstimationType(roomId);
        return estimationType === 't-shirt' ? '-' : 0;
      } catch {
        return 0;
      }
    }

    try {
      const estimationType = await this.roomManagementService.getRoomEstimationType(roomId);
      if (estimationType === 't-shirt') {
        const modeNumber = this.calculateMode(votes);
        return this.numberToTshirtSize(modeNumber);
      } else {
        return this.calculateAverage(votes);
      }
    } catch (error) {
      console.error('Error getting estimation type, falling back to average:', error);
      return this.calculateAverage(votes);
    }
  }
}

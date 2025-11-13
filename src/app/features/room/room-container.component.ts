import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { RoomConfig } from '../../core/types/room.types';
import { VoteStateService } from '../../core/services/vote-state.service';
import { UIStateService } from '../../core/services/ui-state.service';
import { VotingService } from '../../core/services/voting.service';
import { RoomPresentationComponent } from './room-presentation.component';
import { Router } from '@angular/router';
import { RoomManagementService } from '../../core/services/room-management.service';
import { FirebaseConnectionService } from '../../core/services/firebase-connection.service';
import { StorageService } from '../../core/services/storage.service';
import { LoggerService } from '../../core/services/logger.service';
import { FIBONACCI_NUMBERS, TSHIRT_SIZES } from '../../core/constants/estimation.constants';

@Component({
  selector: 'app-room-container',
  standalone: true,
  imports: [CommonModule, RoomPresentationComponent],
  templateUrl: './room-container.component.html'
})
export class RoomContainerComponent implements OnInit {
  public readonly numbers = [...FIBONACCI_NUMBERS];
  public readonly tshirtSizes = [...TSHIRT_SIZES];
  public selectedNumber = signal<number | null>(null);
  public selectedSize = signal<string | null>(null);
  public state!: RoomConfig;
  public copyingLink = signal(false);
  public usersConnectedCount = signal<number>(0);
  public usersVotedCount = signal<number>(0);
  public votes = signal<(number | null)[]>([]);
  public averageVotes = signal<number | string>(0);
  public forceReveal = signal<boolean>(false);

  private location = inject(Location);
  private router = inject(Router);
  private votingService = inject(VotingService);
  private voteStateService = inject(VoteStateService);
  private uiStateService = inject(UIStateService);
  private roomManagementService = inject(RoomManagementService);
  private firebaseService = inject(FirebaseConnectionService);
  private storageService = inject(StorageService);
  private logger = inject(LoggerService);

  public async ngOnInit(): Promise<void> {
    this.logger.log('RoomContainerComponent: Initializing...');

    const locationState = this.location.getState() as RoomConfig;
    const historyState = history.state as RoomConfig;
    this.logger.log('Location state:', locationState);
    this.logger.log('History state:', historyState);

    let sessionState: RoomConfig | null = null;
    const storedConfig = this.storageService.getItem('roomConfig');
    if (storedConfig) {
      try {
        sessionState = JSON.parse(storedConfig) as RoomConfig;
        this.logger.log('Loaded session state from storage:', sessionState);
      } catch (e) {
        this.logger.error('Failed to parse room config from sessionStorage', e);
      }
    }

    if (locationState?.roomId && locationState?.userId) {
      this.logger.log('Using location state');
      this.state = locationState;
    } else if (historyState?.roomId && historyState?.userId) {
      this.logger.log('Using history state');
      this.state = historyState;
    } else if (sessionState?.roomId && sessionState?.userId) {
      this.logger.log('Using session state');
      this.state = sessionState;
    } else {
      this.logger.log('No valid state found, redirecting to welcome');
      this.router.navigate(['/welcome']);
      return;
    }

    const stateToStore = {
      ...this.state,
      lastActive: Date.now()
    };
    this.logger.log('Storing state in sessionStorage:', stateToStore);
    this.storageService.setItem('roomConfig', JSON.stringify(stateToStore));

    if (this.state.isHost) {
      try {
        await this.firebaseService.updateData(
          this.firebaseService.getParticipantPath(this.state.roomId, this.state.userId),
          {
            lastActive: Date.now(),
            isHost: true,
            isSpectator: false
          }
        );

        await this.firebaseService.updateData(`rooms/${this.state.roomId}`, {
          hostId: this.state.userId,
          lastActivity: Date.now()
        });
      } catch (error) {
        this.logger.error('Error restoring host session:', error);
      }
    } else {
      this.uiStateService.setupRoomDeletionListener(this.state.roomId);

      try {
        await this.firebaseService.updateData(
          this.firebaseService.getParticipantPath(this.state.roomId, this.state.userId),
          { lastActive: Date.now() }
        );
      } catch (error) {
        this.logger.error('Error updating participant status:', error);
      }
    }

    const voteState$ = this.voteStateService.getVoteStateForUI(this.state.roomId);

    const voteState = toSignal(voteState$, { initialValue: { votes: [], usersConnectedCount: 0, usersVotedCount: 0, averageVote: 0, forceReveal: false } });

    effect(() => {
      const state = voteState();
      this.votes.set(state.votes);
      this.usersConnectedCount.set(state.usersConnectedCount);
      this.usersVotedCount.set(state.usersVotedCount);
      this.averageVotes.set(state.averageVote);
      this.forceReveal.set(state.forceReveal);
    }, { allowSignalWrites: true });

    const userVote$ = this.votingService.getUserVote(this.state.roomId, this.state.userId);
    const userVote = toSignal(userVote$, { initialValue: null });

    effect(() => {
      const vote = userVote();
      if (vote === null) {
        this.selectedNumber.set(null);
        this.selectedSize.set(null);
        return;
      }

      if (this.state.estimationType === 't-shirt') {
        this.selectedSize.set(this.tshirtSizes[vote - 1] || null);
        this.selectedNumber.set(vote);
      } else {
        this.selectedNumber.set(vote);
      }
    }, { allowSignalWrites: true });
  }

  public onValueSelect(vote: number | string): void {
    let numericVote: number;
    if (this.state.estimationType === 't-shirt') {
      const voteStr = vote as string;
      numericVote = this.tshirtSizes.indexOf(voteStr as typeof this.tshirtSizes[number]) + 1;
      this.selectedSize.set(voteStr);
    } else {
      numericVote = vote as number;
    }

    if (this.selectedNumber() === null) {
      this.selectedNumber.set(numericVote);
    }
    this.voteStateService.handleVote(this.state.roomId, this.state.userId, numericVote);
  }

  public deleteMyVote(): void {
    this.voteStateService.handleVote(this.state.roomId, this.state.userId, null);
    this.selectedNumber.set(null);
    this.selectedSize.set(null);
  }

  public copyInviteLink(): void {
    this.uiStateService.copyInviteLink(this.state.roomId);
    this.uiStateService.setTemporaryState(value => this.copyingLink.set(value));
  }

  public async onResetVotes(): Promise<void> {
    try {
      await this.votingService.resetVotes(this.state.roomId, this.state.userId);
      this.voteStateService.resetConfettiState(this.state.roomId);
      this.selectedNumber.set(null);
    } catch (error) {
      this.logger.error('Error resetting votes:', error);
    }
  }

  public async onForceReveal(): Promise<void> {
    try {
      const usersVoted = this.usersVotedCount() || 0;
      const usersConnected = this.usersConnectedCount() || 0;

      if (!this.canForceReveal(usersVoted, usersConnected)) {
        return;
      }

      await this.votingService.forceRevealCards(this.state.roomId, this.state.userId);
    } catch (error) {
      this.logger.error('Error forcing card reveal:', error);
    }
  }

  public hasNullVotes(votes: (number | null)[]): boolean {
    return this.voteStateService.hasNullVotes(votes);
  }

  public leaveRoom(): void {
    this.uiStateService.leaveRoom(this.state.roomId, this.state.userId, this.state.isHost);
  }

  public async toggleSpectator(): Promise<void> {
    const usersConnected = this.usersConnectedCount() || 0;
    const usersVoted = this.usersVotedCount() || 0;

    if (this.allUsersHaveVoted(usersConnected, usersVoted)) {
      return;
    }

    this.state.isSpectator = !this.state.isSpectator;

    this.storageService.setItem('roomConfig', JSON.stringify(this.state));

    await this.votingService.updateSpectatorStatus(this.state.roomId, this.state.userId, this.state.isSpectator);

    this.selectedNumber.set(null);
    this.selectedSize.set(null);
  }

  private canForceReveal(voted: number, connected: number): boolean {
    return voted > 0 && connected > 1 && voted < connected;
  }

  private allUsersHaveVoted(connected: number, voted: number): boolean {
    return connected > 0 && voted === connected;
  }
}

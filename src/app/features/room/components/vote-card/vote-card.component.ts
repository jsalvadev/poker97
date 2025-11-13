import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from 'angular-tabler-icons';
import { TSHIRT_SIZES } from '../../../../core/constants/estimation.constants';

@Component({
  selector: 'app-vote-card',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  templateUrl: './vote-card.component.html'
})
export class VoteCardComponent {
  public readonly vote = input<number | null>(null);
  public readonly showNullVote = input(false);
  public readonly allVoted = input(false);
  public readonly estimationType = input<'fibonacci' | 't-shirt'>('fibonacci');
  public readonly isHost = input(false);
  public readonly userId = input<string>('');
  public readonly currentUserId = input<string>('');
  public readonly removePlayer = output<string>();
  private readonly tshirtSizes = TSHIRT_SIZES;

  public get showRemoveButton(): boolean {
    return this.isHost() && this.userId() !== this.currentUserId() && this.userId() !== '';
  }

  public onRemoveClick(event: Event): void {
    event.stopPropagation();
    this.removePlayer.emit(this.userId());
  }

  public getDisplayValue(): string {
    if (this.vote() === null) {
      return '?';
    }

    if (this.estimationType() === 't-shirt') {
      const index = this.vote()! - 1;
      if (index >= 0 && index < this.tshirtSizes.length) {
        return this.tshirtSizes[index];
      }
    }

    return this.vote()!.toString();
  }

  public getImageSrc(): string {
    if (!this.vote()) return '';

    if (this.estimationType() === 'fibonacci') {
      return `images/numbers/${this.vote()}.webp`;
    } else {
      const tshirtSize = this.getDisplayValue();
      return `images/tshirts/${tshirtSize.toLowerCase()}.webp`;
    }
  }
}

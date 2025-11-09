import { Component, HostListener, OnInit, output, signal } from '@angular/core';
import { TablerIconComponent } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';

interface HelpItem {
  title: string;
  description: string;
  list?: { text: string }[];
}

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [TablerIconComponent, CommonModule],
  templateUrl: './help-modal.component.html'
})
export class HelpModalComponent implements OnInit {
  readonly close = output<void>();
  readonly isClosing = signal(false);
  readonly isInitialized = signal(false);

  helpItems: HelpItem[] = [
    {
      title: 'Estimation Methods',
      description: "Choose the method that best fits your team's needs:",
      list: [
        { text: 'Fibonacci (1, 2, 3, 5, 8, 13, 21): Best for story points estimation with increasing complexity' },
        { text: 'T-Shirt Sizes (XS, S, M, L, XL): Ideal for quick, relative sizing of features' }
      ]
    },
    {
      title: 'Creating a Room',
      description: 'Start a planning session by clicking "Create Room". As the host, you\'ll have additional controls:',
      list: [
        { text: 'Reset votes: Clear all estimates to start a new round' },
        { text: 'Share link: Generate and copy a room link to invite others (green button)' },
        { text: 'See who has voted: Track participation in real-time' },
        { text: 'Watch/Vote mode: Switch between voting and spectating as needed (blue button)' }
      ]
    },
    {
      title: 'Joining a Room',
      description: 'When you have a room link, you can join and participate in these modes:',
      list: [
        { text: 'Vote mode: Actively participate in voting on all items' },
        { text: 'Watch mode: Observe the session without influencing estimates (great for stakeholders)' },
        { text: 'Switch anytime: You can change between modes using the blue button at the top right' }
      ]
    },
    {
      title: 'Role Switching',
      description: 'Everyone (including the host) can switch between voting and spectating:',
      list: [
        { text: 'Use the blue "Watch mode"/"Vote mode" button in the top right corner' },
        { text: 'Switching to Watch mode removes your vote and card from the current round' },
        { text: 'You cannot switch roles when all votes are revealed - wait for a new voting round' }
      ]
    },
    {
      title: 'Voting Process',
      description:
        'Select a card that represents your estimate. Cards remain hidden until everyone votes, preventing bias.',
      list: [
        { text: 'Change vote: You can modify your estimate before all votes are revealed' },
        { text: 'Results are displayed with an automatically calculated average' },
        { text: "Cards flip and reveal everyone's votes simultaneously for transparency" }
      ]
    },
    {
      title: 'Best Practices',
      description: 'Get the most out of your planning poker sessions:',
      list: [
        { text: 'Discuss after revealing: Address significant estimate differences' },
        { text: 'Keep sessions focused: Aim for 5-10 items per session' },
        { text: "Vote independently: Form your own opinion before seeing others' votes" },
        { text: 'Use Watch mode when you want to observe without influencing the voting process' }
      ]
    }
  ];

  ngOnInit(): void {
    setTimeout(() => {
      this.isInitialized.set(true);
    }, 0);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeWithAnimation();
  }

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.closeWithAnimation();
    }
  }

  closeWithAnimation(): void {
    if (this.isClosing()) return;

    this.isClosing.set(true);

    setTimeout(() => {
      this.close.emit(void 0);
    }, 500);
  }
}

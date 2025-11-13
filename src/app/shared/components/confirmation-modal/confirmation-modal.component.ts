import { Component, HostListener, OnInit, output, signal } from '@angular/core';
import { TablerIconComponent } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [TablerIconComponent, CommonModule],
  templateUrl: './confirmation-modal.component.html'
})
export class ConfirmationModalComponent implements OnInit {
  readonly confirm = output<void>();
  readonly cancel = output<void>();
  readonly isClosing = signal(false);
  readonly isInitialized = signal(false);

  ngOnInit(): void {
    setTimeout(() => {
      this.isInitialized.set(true);
    }, 0);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.cancelWithAnimation();
  }

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.cancelWithAnimation();
    }
  }

  confirmWithAnimation(): void {
    if (this.isClosing()) return;

    this.isClosing.set(true);

    setTimeout(() => {
      this.confirm.emit(void 0);
    }, 300);
  }

  cancelWithAnimation(): void {
    if (this.isClosing()) return;

    this.isClosing.set(true);

    setTimeout(() => {
      this.cancel.emit(void 0);
    }, 300);
  }
}

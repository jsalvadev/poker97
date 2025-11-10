import { Injectable, OnDestroy } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService implements OnDestroy {
  private activeIntervals: Set<number> = new Set();

  public trigger(): void {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        this.activeIntervals.delete(interval);
        return;
      }

      const particleCount = 100 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    this.activeIntervals.add(interval);
  }

  ngOnDestroy(): void {
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeIntervals.clear();
  }
}

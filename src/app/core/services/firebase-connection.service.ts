import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { DataSnapshot, get, getDatabase, onValue, push, ref, set, update } from 'firebase/database';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseConnectionService {
  private app = initializeApp(environment.firebaseConfig);
  private db = getDatabase(this.app);

  public getRef(path: string) {
    return ref(this.db, path);
  }

  public async getData(path: string) {
    const dataRef = this.getRef(path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  public async setData(path: string, data: unknown) {
    const dataRef = this.getRef(path);
    return set(dataRef, data);
  }

  public async updateData(path: string, data: object) {
    const dataRef = this.getRef(path);
    return update(dataRef, data);
  }

  public async pushData(path: string, data?: unknown) {
    const listRef = this.getRef(path);
    const newRef = push(listRef);
    const key = newRef.key!;

    if (data) {
      await set(newRef, data);
    }

    return key;
  }

  public createObservable<T>(dbPath: string, transformFn: (snapshot: DataSnapshot) => T): Observable<T> {
    const dbRef = this.getRef(dbPath);
    return new Observable<T>(subscriber => {
      const unsubscribe = onValue(
        dbRef,
        snapshot => {
          subscriber.next(transformFn(snapshot));
        },
        error => {
          subscriber.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  public getRoomPath(roomId: string): string {
    return `rooms/${roomId}`;
  }

  public getParticipantsPath(roomId: string): string {
    return `${this.getRoomPath(roomId)}/participants`;
  }

  public getParticipantPath(roomId: string, userId: string): string {
    return `${this.getParticipantsPath(roomId)}/${userId}`;
  }

  public getVotePath(roomId: string, userId: string): string {
    return `${this.getParticipantPath(roomId, userId)}/vote`;
  }
}

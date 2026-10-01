import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly _loading$ = new BehaviorSubject<boolean>(true);
  readonly loading$ = this._loading$.asObservable();

  constructor() {
    inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this._loading$.next(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this._loading$.next(false);
      }
    });
  }
}

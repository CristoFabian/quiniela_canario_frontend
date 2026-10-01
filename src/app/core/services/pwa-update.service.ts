import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
      )
      .subscribe(() => {
        const shouldUpdate = window.confirm(
          'Hay una nueva versión disponible. ¿Quieres actualizar la aplicación ahora?'
        );

        if (shouldUpdate) {
          this.swUpdate.activateUpdate();
          window.location.reload();
        }
      });
  }
}

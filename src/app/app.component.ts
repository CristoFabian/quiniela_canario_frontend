import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/loading/loading.component';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pwaUpdate = inject(PwaUpdateService);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('app-init-loader');
      if (el) el.remove();
    }
  }
}

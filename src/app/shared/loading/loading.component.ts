import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {
  readonly loadingService = inject(LoadingService);
}

import 'zone.js'; // <-- NG0908 HATASINI ÇÖZEN KRİTİK SATIRS
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
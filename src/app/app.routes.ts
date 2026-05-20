import { Routes } from '@angular/router';
import { DEFAULT_SCENARIO_ID } from './core/data/scenarios.data';
import { GameComponent } from './game/game.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: DEFAULT_SCENARIO_ID,
  },
  {
    path: ':scenarioId',
    component: GameComponent,
  },
  {
    path: '**',
    redirectTo: DEFAULT_SCENARIO_ID,
  },
];

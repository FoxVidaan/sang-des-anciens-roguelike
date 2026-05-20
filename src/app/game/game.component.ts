import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameEngineService } from '../core/services/game-engine.service';
import { DEFAULT_SCENARIO_ID } from '../core/data/scenarios.data';
import {
  Choice,
  Event,
  GameEnding,
  GameState,
  Player,
  ScenarioDefinition,
} from '../models/game.models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.sass',
})
export class GameComponent {
  readonly game: GameEngineService = inject(GameEngineService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);

  readonly state = computed<GameState>(() => this.game.state());
  readonly scenario = computed<ScenarioDefinition>(() => this.game.scenario);
  readonly currentEvent = computed<Event | null>(() => this.state().currentEvent);
  readonly player = computed<Player>(() => this.state().player);
  readonly displayedChoices = computed<readonly Choice[]>(() => {
    const event: Event | null = this.currentEvent();

    if (!event) {
      return [];
    }

    return [...event.choices]
      .sort((firstChoice: Choice, secondChoice: Choice): number =>
        Number(this.isChoiceDisabled(firstChoice)) - Number(this.isChoiceDisabled(secondChoice)),
      )
      .slice(0, 4);
  });
  readonly latestLogs = computed<readonly string[]>(() => this.state().log.slice(0, 5));
  readonly sceneLabel = computed<string>(() => this.scenario().getSceneLabel(this.state().meta));
  readonly hasStarted = computed<boolean>(
    () => this.currentEvent() !== null || this.state().gameOver,
  );
  readonly endingTitle = computed<string>(() => this.getEndingTitle(this.state().ending));
  readonly endingText = computed<string>(() => this.getEndingText(this.state().ending));

  constructor() {
    const scenarioId: string = this.route.snapshot.paramMap.get('scenarioId') ?? DEFAULT_SCENARIO_ID;

    if (!this.game.useScenario(scenarioId)) {
      void this.router.navigate([DEFAULT_SCENARIO_ID], { replaceUrl: true });
    }
  }

  isChoiceDisabled(choice: Choice): boolean {
    return choice.condition !== undefined && !choice.condition(this.state().meta, this.player());
  }

  private getEndingTitle(ending: GameEnding | null): string {
    switch (ending) {
      case 'corruption':
        return 'Thanatos gagne en force.';
      case 'madness':
        return 'Ton esprit se brise.';
      case 'thanatos-weakened':
        return 'Thanatos recule.';
      default:
        return "La journée s'eteint.";
    }
  }

  private getEndingText(ending: GameEnding | null): string {
    switch (ending) {
      case 'corruption':
        return "La corruption n'est plus une trace en toi. Elle devient une porte, et Thanatos s'y engouffre.";
      case 'madness':
        return "Les retours successifs ne forment plus une suite. Tu restes prisonnier d'instants qui se répètent sans toi.";
      case 'thanatos-weakened':
        return "Le rituel n'efface pas la catastrophe, mais une part de Thanatos reste prise dans la fracture.";
      default:
        return 'Le monde reprend son souffle. Ce que tu as compris demeure.';
    }
  }
}

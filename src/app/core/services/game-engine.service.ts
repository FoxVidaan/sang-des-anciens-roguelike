import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import {
  GameEnding,
  GameState,
  Choice,
  Player,
  MetaProgression,
  Event,
  ScenarioDefinition,
} from '../../models/game.models';
import { SaveGameService } from './save-game.services';
import { SerializableGameState } from '../../models/save.models';
import { DEFAULT_SCENARIO_ID, findScenario } from '../data/scenarios.data';

const MAX_HP: number = 20;
const MAX_LOOPS: number = 5;
const CORRUPTION_ENDING_THRESHOLD: number = 100;
const MADNESS_ENDING_THRESHOLD: number = 100;
const COMPLETION_ENDING_ID: string = 'academy-prequel-complete';

@Injectable({ providedIn: 'root' })
export class GameEngineService {
  private readonly save: SaveGameService = inject(SaveGameService);
  private currentScenario: ScenarioDefinition = this.resolveScenario(DEFAULT_SCENARIO_ID);
  private eventsMap: Map<string, Event> = this.createEventsMap(this.currentScenario.events);

  readonly state: WritableSignal<GameState> = signal<GameState>(this.getInitialState());
  readonly hasSave: WritableSignal<boolean> = signal(false);

  constructor() {
    this.restore();
  }

  get scenario(): ScenarioDefinition {
    return this.currentScenario;
  }

  useScenario(scenarioId: string): boolean {
    const scenario: ScenarioDefinition | null = findScenario(scenarioId);

    if (!scenario) {
      return false;
    }

    if (scenario.id === this.currentScenario.id) {
      this.restore();
      return true;
    }

    this.currentScenario = scenario;
    this.eventsMap = this.createEventsMap(scenario.events);
    this.state.set(this.getInitialState());
    this.hasSave.set(false);
    this.restore();
    return true;
  }

  private getInitialState(): GameState {
    return {
      player: {
        hp: MAX_HP,
        sanity: 0,
        corruption: 0,
        insight: 0,
        loop: 1,
      },
      currentEvent: null,
      log: [],
      meta: {
        seenEvents: {},
        discoveredTruths: [],
        unlockedChoices: [],
        endingsSeen: [],
      },
      gameOver: false,
      ending: null,
    };
  }

  start(): void {
    const meta: MetaProgression =
      this.save.loadMeta(this.currentScenario.id) ?? this.getInitialState().meta;
    const loopVisits: number = meta.seenEvents[this.currentScenario.loopEventId] ?? 0;
    const initialState: GameState = this.getInitialState();

    this.state.set({
      ...initialState,
      player: {
        ...initialState.player,
        loop: loopVisits + 1,
      },
      meta,
      log: [
        loopVisits > 0 ? this.currentScenario.repeatStartLog : this.currentScenario.firstStartLog,
      ],
    });

    this.persist();
    this.nextEvent(this.currentScenario.startEventId);
  }

  continue(): void {
    this.restore();
  }

  nextEvent(eventId?: string): void {
    const event: Event | null = this.resolveNextEvent(
      eventId,
      this.state().currentEvent?.id ?? null,
    );

    if (!event) {
      this.endRun();
      return;
    }

    this.enterEvent(event);
  }

  choose(choice: Choice): void {
    const currentEvent: Event | null = this.state().currentEvent;

    if (!currentEvent || this.isChoiceDisabled(choice)) {
      return;
    }

    this.state.update((s: GameState): GameState => {
      const player: Player = this.applyChoiceEffect(s.player, choice);
      const meta: MetaProgression = this.applyChoiceMetaEffect(s.meta, choice);

      return {
        ...s,
        player,
        meta,
        log: [choice.log, ...s.log],
      };
    });

    const ending: GameEnding | null = this.getPermanentEnding(this.state().player, choice);

    if (ending) {
      this.endGame(ending);
      return;
    }

    if (this.state().player.hp <= 0) {
      this.restartLoopAfterWounds();
      return;
    }

    this.persist();
    this.nextEvent(choice.nextEventId);
  }

  abandon(): void {
    this.save.clearAll(this.currentScenario.id);
    this.state.set(this.getInitialState());
    this.hasSave.set(false);
  }

  private enterEvent(event: Event): void {
    this.state.update((s: GameState): GameState => {
      const seen = s.meta.seenEvents[event.id] ?? 0;

      return {
        ...s,
        currentEvent: event,
        meta: {
          ...s.meta,
          seenEvents: {
            ...s.meta.seenEvents,
            [event.id]: seen + 1,
          },
        },
      };
    });

    this.persist();
  }

  private applyChoiceEffect(player: Player, choice: Choice): Player {
    return {
      ...player,
      hp: Math.max(0, player.hp + (choice.effect.hp ?? 0)),
      sanity: Math.max(0, player.sanity + (choice.effect.sanity ?? 0)),
      corruption: Math.max(0, player.corruption + (choice.effect.corruption ?? 0)),
      insight: Math.max(0, player.insight + (choice.effect.insight ?? 0)),
      loop: Math.max(1, player.loop + (choice.effect.loop ?? 0)),
    };
  }

  private applyChoiceMetaEffect(meta: MetaProgression, choice: Choice): MetaProgression {
    if (!choice.metaEffect) {
      return meta;
    }

    return {
      ...meta,
      discoveredTruths: this.mergeUnique(
        meta.discoveredTruths,
        choice.metaEffect.discoveredTruths ?? [],
      ),
      unlockedChoices: this.mergeUnique(
        meta.unlockedChoices,
        choice.metaEffect.unlockedChoices ?? [],
      ),
      endingsSeen: this.mergeUnique(meta.endingsSeen, choice.metaEffect.endingsSeen ?? []),
    };
  }

  private mergeUnique(current: string[], additions: readonly string[]): string[] {
    return [...new Set([...current, ...additions])];
  }

  private getPermanentEnding(player: Player, choice: Choice): GameEnding | null {
    if (choice.metaEffect?.endingsSeen?.includes(COMPLETION_ENDING_ID)) {
      return 'thanatos-weakened';
    }

    if (player.corruption >= CORRUPTION_ENDING_THRESHOLD) {
      return 'corruption';
    }

    if (player.sanity >= MADNESS_ENDING_THRESHOLD) {
      return 'madness';
    }

    return null;
  }

  private isChoiceDisabled(choice: Choice): boolean {
    const currentEvent: Event | null = this.state().currentEvent;
    const isAvailableChoice: boolean =
      currentEvent?.choices.some((eventChoice: Choice) => eventChoice.id === choice.id) ?? false;

    return (
      !isAvailableChoice ||
      (choice.condition !== undefined && !choice.condition(this.state().meta, this.state().player))
    );
  }

  private resolveNextEvent(
    eventId: string | undefined,
    currentEventId: string | null,
  ): Event | null {
    if (eventId) {
      const explicitEvent: Event | undefined = this.eventsMap.get(eventId);

      if (explicitEvent) {
        return explicitEvent;
      }
    }

    if (!currentEventId) {
      return this.currentScenario.events[0] ?? null;
    }

    const currentIndex: number = this.currentScenario.events.findIndex(
      (event: Event): boolean => event.id === currentEventId,
    );
    const nextIndex: number = currentIndex + 1;

    return this.currentScenario.events[nextIndex] ?? null;
  }

  private hydrateRun(run: SerializableGameState, meta: MetaProgression | null): GameState {
    return {
      player: run.player,
      currentEvent: run.currentEventId ? (this.eventsMap.get(run.currentEventId) ?? null) : null,
      log: run.log,
      meta: meta ?? run.meta,
      gameOver: run.gameOver,
      ending: run.ending,
    };
  }

  private endRun(): void {
    this.restartLoopAfterWounds();
  }

  private restartLoopAfterWounds(): void {
    const nextLoop: number = this.state().player.loop + 1;

    if (nextLoop > MAX_LOOPS) {
      this.state.update(
        (s: GameState): GameState => ({
          ...s,
          player: {
            ...s.player,
            hp: 0,
            sanity: Math.max(s.player.sanity, MADNESS_ENDING_THRESHOLD),
          },
          log: ['La journée refuse de recommencer une fois de plus.', ...s.log],
        }),
      );
      this.endGame('madness');
      return;
    }

    this.state.update((s: GameState) => ({
      ...s,
      player: {
        ...s.player,
        hp: MAX_HP,
        loop: nextLoop,
      },
      currentEvent: null,
      gameOver: false,
      ending: null,
      log: ['Tu rouvres les yeux au matin, les blessures refermées.', ...s.log],
    }));

    this.persist();
    this.nextEvent(this.currentScenario.loopEventId);
  }

  private endGame(ending: GameEnding): void {
    this.state.update((s: GameState) => ({
      ...s,
      currentEvent: null,
      gameOver: true,
      ending,
      meta: {
        ...s.meta,
        endingsSeen: this.mergeUnique(s.meta.endingsSeen, [ending]),
      },
    }));

    this.clearSavesAfterPermanentEnding();
  }

  private clearSavesAfterPermanentEnding(): void {
    this.save.clearAll(this.currentScenario.id);
    this.hasSave.set(false);
  }

  private persist(): void {
    this.save.saveRun(this.currentScenario.id, this.state());
    this.save.saveMeta(this.currentScenario.id, this.state().meta);
    this.hasSave.set(true);
  }

  private restore(): void {
    const run: SerializableGameState | null = this.save.loadRun(this.currentScenario.id);
    const meta: MetaProgression | null = this.save.loadMeta(this.currentScenario.id);

    if (run) {
      this.state.set(this.hydrateRun(run, meta));
      this.hasSave.set(true);
      return;
    }

    if (meta) {
      this.state.update((s: GameState) => ({ ...s, meta }));
    }
  }

  private resolveScenario(scenarioId: string): ScenarioDefinition {
    const scenario: ScenarioDefinition | null = findScenario(scenarioId);

    if (!scenario) {
      throw new Error(`Unknown scenario "${scenarioId}".`);
    }

    return scenario;
  }

  private createEventsMap(events: readonly Event[]): Map<string, Event> {
    return new Map(events.map((event: Event): [string, Event] => [event.id, event]));
  }
}

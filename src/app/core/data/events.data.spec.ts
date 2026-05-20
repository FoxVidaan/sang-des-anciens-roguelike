import { TestBed } from '@angular/core/testing';
import { ERRANT_DU_TEMPS_EVENTS as EVENTS } from './scenarios/errant-du-temps.events.data';
import { Choice, Event, GameState, MetaProgression, Player } from '../../models/game.models';
import { GameEngineService } from '../services/game-engine.service';

const runKey = 'sda:errant-du-temps:run';
const metaKey = 'sda:errant-du-temps:meta';

const basePlayer: Player = {
  hp: 20,
  sanity: 0,
  corruption: 0,
  insight: 20,
  loop: 4,
};

const allTruthIds: readonly string[] = [
  ...new Set(
    EVENTS.flatMap((event: Event): string[] =>
      event.choices.flatMap((choice: Choice): string[] => choice.metaEffect?.discoveredTruths ?? []),
    ),
  ),
];

const allUnlockedChoiceIds: readonly string[] = [
  ...new Set(
    EVENTS.flatMap((event: Event): string[] =>
      event.choices.flatMap((choice: Choice): string[] => choice.metaEffect?.unlockedChoices ?? []),
    ),
  ),
];

const allSeenEvents = (): Record<string, number> =>
  Object.fromEntries(EVENTS.map((event: Event): [string, number] => [event.id, 5]));

const omniscientMeta = (): MetaProgression => ({
  seenEvents: allSeenEvents(),
  discoveredTruths: [...allTruthIds],
  unlockedChoices: [...allUnlockedChoiceIds],
  endingsSeen: [],
});

const getEvent = (eventId: string): Event => {
  const event: Event | undefined = EVENTS.find((candidate: Event) => candidate.id === eventId);

  if (!event) {
    throw new Error(`Expected event "${eventId}" to exist.`);
  }

  return event;
};

const getChoice = (eventId: string, choiceId: string): Choice => {
  const choice: Choice | undefined = getEvent(eventId).choices.find(
    (candidate: Choice) => candidate.id === choiceId,
  );

  if (!choice) {
    throw new Error(`Expected choice "${choiceId}" to exist in event "${eventId}".`);
  }

  return choice;
};

const prepareEngineAt = (
  engine: GameEngineService,
  eventId: string,
  player: Player = basePlayer,
  meta: MetaProgression = omniscientMeta(),
): void => {
  engine.state.set({
    player,
    currentEvent: getEvent(eventId),
    log: [],
    meta,
    gameOver: false,
    ending: null,
  });
  engine.hasSave.set(true);
};

const expectMetaEffectsApplied = (state: GameState, choice: Choice): void => {
  for (const truth of choice.metaEffect?.discoveredTruths ?? []) {
    expect(state.meta.discoveredTruths).toContain(truth);
  }

  for (const unlockedChoice of choice.metaEffect?.unlockedChoices ?? []) {
    expect(state.meta.unlockedChoices).toContain(unlockedChoice);
  }

  for (const ending of choice.metaEffect?.endingsSeen ?? []) {
    expect(state.meta.endingsSeen).toContain(ending);
  }
};

describe('EVENTS graph', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses unique event ids and unique choice ids per event', () => {
    const eventIds: string[] = EVENTS.map((event: Event): string => event.id);

    expect(new Set(eventIds).size).toBe(eventIds.length);

    for (const event of EVENTS) {
      const choiceIds: string[] = event.choices.map((choice: Choice): string => choice.id);

      expect(new Set(choiceIds).size).toBe(choiceIds.length);
    }
  });

  it('has valid destinations and renderable text for every event', () => {
    const eventIds: Set<string> = new Set(EVENTS.map((event: Event): string => event.id));

    for (const event of EVENTS) {
      expect(event.text(omniscientMeta()).trim().length).toBeGreaterThan(0);
      expect(event.choices.length).toBeGreaterThan(0);

      for (const choice of event.choices) {
        expect(choice.label.trim().length).toBeGreaterThan(0);
        expect(choice.log.trim().length).toBeGreaterThan(0);

        if (choice.nextEventId !== undefined) {
          expect(eventIds.has(choice.nextEventId)).toBe(true);
        }
      }
    }
  });

  it('makes every conditional choice available with an endgame-capable state', () => {
    const meta: MetaProgression = omniscientMeta();
    const player: Player = {
      ...basePlayer,
      corruption: 40,
      insight: 30,
      loop: 5,
    };

    for (const event of EVENTS) {
      for (const choice of event.choices) {
        expect(choice.condition?.(meta, player) ?? true).toBe(true);
      }
    }
  });

  it('applies stat effects, meta effects, logs, and transitions for every choice', () => {
    const engine: GameEngineService = TestBed.inject(GameEngineService);

    for (const event of EVENTS) {
      for (const choice of event.choices) {
        const player: Player = {
          ...basePlayer,
          loop: 4,
          insight: 30,
        };
        const meta: MetaProgression = omniscientMeta();

        prepareEngineAt(engine, event.id, player, meta);
        engine.choose(choice);

        const state: GameState = engine.state();
        expect(state.log).toContain(choice.log);
        expectMetaEffectsApplied(state, choice);

        if (state.gameOver) {
          expect(state.ending).not.toBeNull();
          expect(localStorage.getItem(runKey)).toBeNull();
          expect(localStorage.getItem(metaKey)).toBeNull();
          continue;
        }

        if ((choice.effect.hp ?? 0) <= -player.hp) {
          expect(state.currentEvent?.id).toBe('academy-day');
          expect(state.player.hp).toBe(20);
          expect(state.player.loop).toBe(player.loop + 1);
          continue;
        }

        expect(state.player.hp).toBe(Math.max(0, player.hp + (choice.effect.hp ?? 0)));
        expect(state.player.sanity).toBe(Math.max(0, player.sanity + (choice.effect.sanity ?? 0)));
        expect(state.player.corruption).toBe(
          Math.max(0, player.corruption + (choice.effect.corruption ?? 0)),
        );
        expect(state.player.insight).toBe(Math.max(0, player.insight + (choice.effect.insight ?? 0)));

        if (choice.nextEventId !== undefined) {
          expect(state.currentEvent?.id).toBe(choice.nextEventId);
        }
      }
    }
  });

  it('keeps locked choices inert when their conditions are not met', () => {
    const engine: GameEngineService = TestBed.inject(GameEngineService);

    for (const event of EVENTS) {
      const lockedChoices: Choice[] = event.choices.filter(
        (choice: Choice): boolean => choice.condition !== undefined,
      );

      for (const choice of lockedChoices) {
        prepareEngineAt(engine, event.id, {
          ...basePlayer,
          insight: 0,
          loop: 1,
        }, {
          seenEvents: {},
          discoveredTruths: [],
          unlockedChoices: [],
          endingsSeen: [],
        });

        engine.choose(choice);

        expect(engine.state().currentEvent?.id).toBe(event.id);
        expect(engine.state().log).toEqual([]);
      }
    }
  });

  it('has a playable route to the corruption ending', () => {
    const engine: GameEngineService = TestBed.inject(GameEngineService);
    const choice: Choice = getChoice('thanatos-arrival', 'open-to-thanatos');

    prepareEngineAt(engine, 'thanatos-arrival', {
      ...basePlayer,
      corruption: 40,
    });

    engine.choose(choice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('corruption');
    expect(engine.state().meta.endingsSeen).toContain('corruption');
  });

  it('has a playable route to the madness ending', () => {
    const engine: GameEngineService = TestBed.inject(GameEngineService);
    const choice: Choice = getChoice('thanatos-arrival', 'protect-students');

    prepareEngineAt(engine, 'thanatos-arrival', {
      ...basePlayer,
      sanity: 99,
    });

    engine.choose(choice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('madness');
    expect(engine.state().meta.endingsSeen).toContain('madness');
  });

  it('has a playable route to the Thanatos-weakened ending', () => {
    const engine: GameEngineService = TestBed.inject(GameEngineService);
    const bindChoice: Choice = getChoice('thanatos-arrival', 'bind-thanatos');
    const holdChoice: Choice = getChoice('partial-seal', 'hold-seal');

    prepareEngineAt(engine, 'thanatos-arrival', {
      ...basePlayer,
      insight: 30,
      loop: 4,
    });

    engine.choose(bindChoice);
    expect(engine.state().currentEvent?.id).toBe('partial-seal');

    engine.choose(holdChoice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('thanatos-weakened');
    expect(engine.state().meta.endingsSeen).toContain('thanatos-weakened');
  });
});

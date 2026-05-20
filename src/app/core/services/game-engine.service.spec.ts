import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { Choice, GameState } from '../../models/game.models';

type StoredRun = {
  data: {
    currentEventId: string | null;
    currentEvent?: unknown;
  };
};

const runKey = 'sda:errant-du-temps:run';
const metaKey = 'sda:errant-du-temps:meta';

const parseStoredRun = (raw: string): StoredRun => {
  const parsed: unknown = JSON.parse(raw);

  if (!isStoredRun(parsed)) {
    throw new Error('Expected stored run to match the save shape.');
  }

  return parsed;
};

const isStoredRun = (value: unknown): value is StoredRun =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  typeof value.data === 'object' &&
  value.data !== null &&
  'currentEventId' in value.data &&
  (typeof value.data.currentEventId === 'string' || value.data.currentEventId === null);

describe('GameEngineService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts on the first event and saves only serializable event state', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();

    const rawRun: string | null = localStorage.getItem(runKey);
    expect(engine.state().currentEvent?.id).toBe('academy-day');
    expect(rawRun).not.toBeNull();

    if (!rawRun) {
      throw new Error('Expected a run save to be written.');
    }

    const storedRun: StoredRun = parseStoredRun(rawRun);
    expect(storedRun.data.currentEventId).toBe('academy-day');
    expect(storedRun.data.currentEvent).toBeUndefined();
  });

  it('hydrates the current event behavior when continuing a saved run', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const restoredEngine = TestBed.inject(GameEngineService);
    const eventText: string | undefined = restoredEngine
      .state()
      .currentEvent?.text(restoredEngine.state().meta);

    expect(restoredEngine.state().currentEvent?.id).toBe('academy-day');
    expect(eventText).toContain('Académie du Temps');
  });

  it('ignores choices that are not currently available', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    const lockedChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'anticipate-day');

    expect(lockedChoice).toBeDefined();
    if (!lockedChoice) {
      throw new Error('Expected the locked anticipation choice to exist.');
    }

    engine.choose(lockedChoice);

    expect(engine.state().currentEvent?.id).toBe('academy-day');
    expect(engine.state().log).toHaveLength(1);
  });

  it('moves to the explicit destination selected by the player', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    const lessonChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'attend-lesson');

    expect(lessonChoice).toBeDefined();
    if (!lessonChoice) {
      throw new Error('Expected the lesson choice to exist.');
    }

    engine.choose(lessonChoice);

    expect(engine.state().currentEvent?.id).toBe('temporal-lesson');
  });

  it('restarts the day with full health when wounds kill the player', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    const deathChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'observe-thanatos');

    expect(deathChoice).toBeDefined();
    if (!deathChoice) {
      throw new Error('Expected the Thanatos observation choice to exist.');
    }

    engine.choose(deathChoice);

    expect(engine.state().gameOver).toBe(false);
    expect(engine.state().ending).toBeNull();
    expect(engine.state().player.hp).toBe(20);
    expect(engine.state().player.loop).toBe(2);
    expect(engine.state().currentEvent?.id).toBe('academy-day');
    expect(engine.state().player.insight).toBeGreaterThan(2);
  });

  it('ends the game when corruption reaches the Thanatos threshold', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    engine.state.update((state: GameState): GameState => ({
      ...state,
      player: {
        ...state.player,
        corruption: 35,
      },
    }));

    const corruptionChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'open-to-thanatos');

    expect(corruptionChoice).toBeDefined();
    if (!corruptionChoice) {
      throw new Error('Expected the corruption choice to exist.');
    }

    engine.choose(corruptionChoice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('corruption');
    expect(engine.state().meta.endingsSeen).toContain('corruption');
    expect(localStorage.getItem(runKey)).toBeNull();
    expect(localStorage.getItem(metaKey)).toBeNull();
  });

  it('ends the game when spirit fragmentation reaches the madness threshold', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    engine.state.update((state: GameState): GameState => ({
      ...state,
      player: {
        ...state.player,
        sanity: 99,
      },
    }));

    const deathChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'protect-students');

    expect(deathChoice).toBeDefined();
    if (!deathChoice) {
      throw new Error('Expected the student protection choice to exist.');
    }

    engine.choose(deathChoice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('madness');
    expect(engine.state().meta.endingsSeen).toContain('madness');
    expect(localStorage.getItem(runKey)).toBeNull();
    expect(localStorage.getItem(metaKey)).toBeNull();
  });

  it('uses perception to unlock choices that can weaken Thanatos', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    engine.state.update((state: GameState): GameState => ({
      ...state,
      player: {
        ...state.player,
        loop: 4,
        insight: 12,
      },
      meta: {
        ...state.meta,
        discoveredTruths: [...state.meta.discoveredTruths, 'thanatos-can-be-weakened'],
        unlockedChoices: [...state.meta.unlockedChoices, 'bind-thanatos'],
      },
    }));

    const sealChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'bind-thanatos');

    expect(sealChoice).toBeDefined();
    if (!sealChoice) {
      throw new Error('Expected the seal choice to exist.');
    }

    engine.choose(sealChoice);

    expect(engine.state().currentEvent?.id).toBe('partial-seal');
    expect(engine.state().gameOver).toBe(false);
  });

  it('ends permanently when wounds would start a sixth loop', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    engine.state.update((state: GameState): GameState => ({
      ...state,
      player: {
        ...state.player,
        loop: 5,
      },
    }));

    const deathChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'observe-thanatos');

    expect(deathChoice).toBeDefined();
    if (!deathChoice) {
      throw new Error('Expected the Thanatos observation choice to exist.');
    }

    engine.choose(deathChoice);

    expect(engine.state().gameOver).toBe(true);
    expect(engine.state().ending).toBe('madness');
    expect(localStorage.getItem(runKey)).toBeNull();
    expect(localStorage.getItem(metaKey)).toBeNull();
  });

  it('clears the whole progression when abandoning the save', () => {
    const engine = TestBed.inject(GameEngineService);

    engine.start();
    engine.nextEvent('thanatos-arrival');
    const deathChoice: Choice | undefined = engine
      .state()
      .currentEvent?.choices.find((choice: Choice) => choice.id === 'observe-thanatos');

    expect(deathChoice).toBeDefined();
    if (!deathChoice) {
      throw new Error('Expected the Thanatos observation choice to exist.');
    }

    engine.choose(deathChoice);
    expect(engine.state().meta.seenEvents['academy-day']).toBeGreaterThan(1);

    engine.abandon();

    expect(engine.hasSave()).toBe(false);
    expect(engine.state().currentEvent).toBeNull();
    expect(engine.state().player.loop).toBe(1);
    expect(engine.state().meta.seenEvents).toEqual({});
    expect(localStorage.getItem(runKey)).toBeNull();
    expect(localStorage.getItem(metaKey)).toBeNull();
  });
});

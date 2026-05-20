import { TestBed } from '@angular/core/testing';
import { MetaProgression } from '../../models/game.models';
import { SaveGameService } from './save-game.services';

const emptyMeta = (): MetaProgression => ({
  seenEvents: {},
  discoveredTruths: [],
  unlockedChoices: [],
  endingsSeen: [],
});

describe('SaveGameService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('keeps meta progression isolated by scenario id', () => {
    const save: SaveGameService = TestBed.inject(SaveGameService);
    const errantMeta: MetaProgression = {
      ...emptyMeta(),
      discoveredTruths: ['thanatos-made-fracture'],
    };
    const futureMeta: MetaProgression = {
      ...emptyMeta(),
      discoveredTruths: ['future-scenario-truth'],
    };

    save.saveMeta('errant-du-temps', errantMeta);
    save.saveMeta('future-scenario', futureMeta);

    expect(save.loadMeta('errant-du-temps')?.discoveredTruths).toEqual([
      'thanatos-made-fracture',
    ]);
    expect(save.loadMeta('future-scenario')?.discoveredTruths).toEqual(['future-scenario-truth']);
    expect(localStorage.getItem('sda_meta')).toBeNull();
  });

  it('clears only the selected scenario progression', () => {
    const save: SaveGameService = TestBed.inject(SaveGameService);

    save.saveMeta('errant-du-temps', {
      ...emptyMeta(),
      seenEvents: { 'academy-day': 2 },
    });
    save.saveMeta('future-scenario', {
      ...emptyMeta(),
      seenEvents: { start: 1 },
    });

    save.clearAll('errant-du-temps');

    expect(save.loadMeta('errant-du-temps')).toBeNull();
    expect(save.loadMeta('future-scenario')?.seenEvents).toEqual({ start: 1 });
  });
});

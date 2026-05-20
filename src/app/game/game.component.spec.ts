import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameComponent } from './game.component';
import { EVENTS } from '../core/data/events.data';
import { Event, GameState } from '../models/game.models';
import { routes } from '../app.routes';

const getEvent = (eventId: string): Event => {
  const event: Event | undefined = EVENTS.find((candidate: Event) => candidate.id === eventId);

  if (!event) {
    throw new Error(`Expected event "${eventId}" to exist.`);
  }

  return event;
};

describe('GameComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('shows at most four choices and moves disabled choices to the end', () => {
    const fixture: ComponentFixture<GameComponent> = TestBed.createComponent(GameComponent);
    const component: GameComponent = fixture.componentInstance;
    const event: Event = getEvent('thanatos-arrival');

    component.game.state.update(
      (state: GameState): GameState => ({
        ...state,
        currentEvent: event,
        player: {
          ...state.player,
          loop: 1,
          insight: 2,
          corruption: 0,
        },
        meta: {
          seenEvents: {},
          discoveredTruths: [],
          unlockedChoices: [],
          endingsSeen: [],
        },
      }),
    );

    const disabledFlags: boolean[] = component.displayedChoices().map((choice) =>
      component.isChoiceDisabled(choice),
    );
    const firstDisabledIndex: number = disabledFlags.indexOf(true);

    expect(component.displayedChoices()).toHaveLength(4);
    expect(firstDisabledIndex).toBeGreaterThan(0);
    expect(disabledFlags.slice(firstDisabledIndex).every((isDisabled: boolean) => isDisabled)).toBe(
      true,
    );
  });
});

export type Player = {
  hp: number;
  sanity: number;
  corruption: number;
  insight: number;
  loop: number;
};

export type GameEnding = 'corruption' | 'madness' | 'thanatos-weakened';

export type MetaProgression = {
  seenEvents: Record<string, number>;
  discoveredTruths: string[];
  unlockedChoices: string[];
  endingsSeen: string[];
};

export type ChoiceEffect = Partial<Player>;

export type ChoiceMetaEffect = Partial<{
  discoveredTruths: string[];
  unlockedChoices: string[];
  endingsSeen: string[];
}>;

export type ConditionFn = (meta: MetaProgression, player: Player) => boolean;

export type Choice = {
  id: string;
  label: string;
  effect: ChoiceEffect;
  metaEffect?: ChoiceMetaEffect;
  log: string;
  nextEventId?: string;
  condition?: ConditionFn;
};

export type Event = {
  id: string;
  title: string;
  text: (meta: MetaProgression) => string;
  choices: Choice[];
};

export type ScenarioIntro = {
  kicker: string;
  title: string;
  location: string;
  heading: string;
  text: string;
};

export type ScenarioDefinition = {
  id: string;
  events: readonly Event[];
  startEventId: string;
  loopEventId: string;
  intro: ScenarioIntro;
  firstStartLog: string;
  repeatStartLog: string;
  getSceneLabel: (meta: MetaProgression) => string;
};

export type GameState = {
  player: Player;
  currentEvent: Event | null;
  log: string[];
  meta: MetaProgression;
  gameOver: boolean;
  ending: GameEnding | null;
};

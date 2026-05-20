import { GameState, MetaProgression } from './game.models';

export type SerializableGameState = Omit<GameState, 'currentEvent'> & {
  currentEventId: string | null;
};

export type SaveWrapper<T> = {
  version: number;
  updatedAt: string;
  data: T;
};

export type RunSave = SaveWrapper<SerializableGameState>;
export type MetaSave = SaveWrapper<MetaProgression>;

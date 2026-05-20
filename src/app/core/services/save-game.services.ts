import { Injectable } from '@angular/core';
import { GameEnding, GameState, MetaProgression, Player } from '../../models/game.models';
import { RunSave, MetaSave, SaveWrapper, SerializableGameState } from '../../models/save.models';

const keyFor = (scenarioId: string, saveType: 'run' | 'meta'): string =>
  `sda:${scenarioId}:${saveType}`;
const VERSION: number = 1;

@Injectable({ providedIn: 'root' })
export class SaveGameService {
  saveRun(scenarioId: string, run: GameState | null): void {
    const runKey: string = keyFor(scenarioId, 'run');

    if (!run) {
      localStorage.removeItem(runKey);
      return;
    }

    const data: SerializableGameState = {
      player: run.player,
      currentEventId: run.currentEvent?.id ?? null,
      log: run.log,
      meta: run.meta,
      gameOver: run.gameOver,
      ending: run.ending,
    };

    const payload: RunSave = {
      version: VERSION,
      updatedAt: new Date().toISOString(),
      data,
    };

    localStorage.setItem(runKey, JSON.stringify(payload));
  }

  loadRun(scenarioId: string): SerializableGameState | null {
    const raw: string | null = localStorage.getItem(keyFor(scenarioId, 'run'));
    if (!raw) return null;

    const parsed: SaveWrapper<unknown> | null = this.parseSave(raw);
    if (!parsed) return null;
    if (parsed.version !== VERSION) return null;
    if (!this.isSerializableGameState(parsed.data)) return null;

    return parsed.data;
  }

  saveMeta(scenarioId: string, meta: MetaProgression): void {
    const payload: MetaSave = {
      version: VERSION,
      updatedAt: new Date().toISOString(),
      data: meta,
    };

    localStorage.setItem(keyFor(scenarioId, 'meta'), JSON.stringify(payload));
  }

  loadMeta(scenarioId: string): MetaProgression | null {
    const raw: string | null = localStorage.getItem(keyFor(scenarioId, 'meta'));
    if (!raw) return null;

    const parsed: SaveWrapper<unknown> | null = this.parseSave(raw);
    if (!parsed) return null;
    if (parsed.version !== VERSION) return null;
    if (!this.isMetaProgression(parsed.data)) return null;

    return parsed.data;
  }

  clearRun(scenarioId: string): void {
    localStorage.removeItem(keyFor(scenarioId, 'run'));
  }

  clearAll(scenarioId: string): void {
    localStorage.removeItem(keyFor(scenarioId, 'run'));
    localStorage.removeItem(keyFor(scenarioId, 'meta'));
  }

  private parseSave(raw: string): SaveWrapper<unknown> | null {
    try {
      const parsed: unknown = JSON.parse(raw);

      if (!this.isSaveWrapper(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private isSaveWrapper(value: unknown): value is SaveWrapper<unknown> {
    return (
      this.isRecord(value) &&
      typeof value['version'] === 'number' &&
      typeof value['updatedAt'] === 'string' &&
      'data' in value
    );
  }

  private isSerializableGameState(value: unknown): value is SerializableGameState {
    return (
      this.isRecord(value) &&
      this.isPlayer(value['player']) &&
      (typeof value['currentEventId'] === 'string' || value['currentEventId'] === null) &&
      this.isStringArray(value['log']) &&
      this.isMetaProgression(value['meta']) &&
      typeof value['gameOver'] === 'boolean' &&
      this.isGameEnding(value['ending'])
    );
  }

  private isPlayer(value: unknown): value is Player {
    return (
      this.isRecord(value) &&
      typeof value['hp'] === 'number' &&
      typeof value['sanity'] === 'number' &&
      typeof value['corruption'] === 'number' &&
      typeof value['insight'] === 'number' &&
      typeof value['loop'] === 'number'
    );
  }

  private isGameEnding(value: unknown): value is GameEnding | null {
    return (
      value === null ||
      value === 'corruption' ||
      value === 'madness' ||
      value === 'thanatos-weakened'
    );
  }

  private isMetaProgression(value: unknown): value is MetaProgression {
    return (
      this.isRecord(value) &&
      this.isSeenEvents(value['seenEvents']) &&
      this.isStringArray(value['discoveredTruths']) &&
      this.isStringArray(value['unlockedChoices']) &&
      this.isStringArray(value['endingsSeen'])
    );
  }

  private isSeenEvents(value: unknown): value is Record<string, number> {
    return (
      this.isRecord(value) &&
      Object.values(value).every((seenCount: unknown) => typeof seenCount === 'number')
    );
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

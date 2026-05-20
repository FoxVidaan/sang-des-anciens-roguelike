import { ScenarioDefinition } from '../../models/game.models';
import { ERRANT_DU_TEMPS_SCENARIO } from './scenarios/errant-du-temps.events.data';

export const DEFAULT_SCENARIO_ID: string = ERRANT_DU_TEMPS_SCENARIO.id;

export const SCENARIOS: readonly ScenarioDefinition[] = [ERRANT_DU_TEMPS_SCENARIO];

export const findScenario = (scenarioId: string): ScenarioDefinition | null =>
  SCENARIOS.find((scenario: ScenarioDefinition): boolean => scenario.id === scenarioId) ?? null;

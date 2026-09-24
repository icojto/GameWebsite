import { CLUES, DIALOGUES, LOCATIONS } from './content';
import { initialState } from './model';
import type { Choice, Condition, Dialogue, Effect, EndingId, Hotspot, LocationId, LogicalState, Variant } from './model';

export class ConditionEvaluator {
  static meets(state: LogicalState, conditions: Condition[] = []): boolean {
    return conditions.every(condition => {
      if ('flag' in condition) return state.flags[condition.flag] === (condition.value ?? true);
      if ('completed' in condition) return state.completedInteractions.includes(condition.completed);
      if ('clue' in condition) return state.discoveredClues.includes(condition.clue);
      return state.discoveredClues.length === Object.keys(CLUES).length;
    });
  }
  static text(state: LogicalState, fallback: string, variants: Variant[] = []): string {
    return variants.find(variant => this.meets(state, variant.when))?.text ?? fallback;
  }
}

export class NarrativeEffects {
  static apply(state: LogicalState, effects: Effect[]): void {
    for (const effect of effects) {
      if ('flag' in effect) state.flags[effect.flag] = effect.value;
      else if ('clue' in effect) {
        if (!state.discoveredClues.includes(effect.clue)) state.discoveredClues.push(effect.clue);
      } else if (!state.completedInteractions.includes(effect.complete)) state.completedInteractions.push(effect.complete);
    }
  }
}

export class LocationController {
  static get(id: string) {
    const location = LOCATIONS.find(location => location.id === id);
    if (!location) throw new Error(`Missing location reference: ${id}`);
    return location;
  }
  static available(state: LogicalState) { return LOCATIONS.filter(location => ConditionEvaluator.meets(state, location.when)); }
  static enter(state: LogicalState, id: LocationId): void {
    const location = this.get(id);
    if (state.sessionState !== 'EXPLORING' || !ConditionEvaluator.meets(state, location.when)) throw new Error('Location unavailable');
    state.currentLocationId = id;
  }
}

export class InteractionSystem {
  static available(state: LogicalState): Hotspot[] {
    return LocationController.get(state.currentLocationId).hotspots.filter(hotspot => ConditionEvaluator.meets(state, hotspot.when));
  }
  static get(state: LogicalState, id: string): Hotspot {
    const hotspot = LocationController.get(state.currentLocationId).hotspots.find(hotspot => hotspot.id === id);
    if (!hotspot) throw new Error(`Missing interaction reference: ${id}`);
    if (!ConditionEvaluator.meets(state, hotspot.when)) throw new Error('Interaction unavailable');
    return hotspot;
  }
}

export class DialogueController {
  static get(id: string): Dialogue {
    const dialogue = DIALOGUES.find(dialogue => dialogue.id === id);
    if (!dialogue) throw new Error(`Missing dialogue reference: ${id}`);
    return dialogue;
  }
  static choices(state: LogicalState): Choice[] {
    if (!state.currentDialogueId || state.dialoguePhase !== 'question') return [];
    return this.get(state.currentDialogueId).choices.filter(choice => ConditionEvaluator.meets(state, choice.when));
  }
  static open(state: LogicalState, id: string): void {
    const dialogue = this.get(id);
    if (dialogue.location !== state.currentLocationId) throw new Error('Dialogue location mismatch');
    state.currentDialogueId = id;
    state.dialoguePhase = state.relevantChoiceOutcomes[id] ? 'reply' : 'question';
    state.sessionState = 'DIALOGUE';
  }
  static choose(state: LogicalState, id: string): Choice {
    const dialogue = state.currentDialogueId;
    if (state.sessionState !== 'DIALOGUE' || !dialogue) throw new Error('No active dialogue');
    const choice = this.choices(state).find(choice => choice.id === id);
    if (!choice) throw new Error('Choice unavailable');
    NarrativeEffects.apply(state, choice.effects);
    NarrativeEffects.apply(state, [{ complete: dialogue }]);
    state.relevantChoiceOutcomes[dialogue] = id;
    state.dialoguePhase = 'reply';
    if (choice.ending) EndingEvaluator.resolve(state, choice.ending);
    return choice;
  }
}

export class EndingEvaluator {
  static resolve(state: LogicalState, ending: EndingId): void {
    const choice = DIALOGUES.find(dialogue => dialogue.id === 'final')!.choices.find(choice => choice.ending === ending)!;
    if (state.ending || state.currentLocationId !== 'sublevel' || state.relevantChoiceOutcomes.final !== choice.id || !ConditionEvaluator.meets(state, choice.when)) throw new Error('Ending unavailable');
    state.ending = ending;
    state.sessionState = 'ENDING';
    state.currentDialogueId = null;
    state.dialoguePhase = null;
  }
}

/** The only mutable logical state owner. Presentation receives cloned snapshots. */
export class NarrativeSession {
  private state: LogicalState;
  constructor(checkpoint: LogicalState = initialState()) { this.state = structuredClone(checkpoint); }
  snapshot(): LogicalState { return structuredClone(this.state); }
  enter(id: LocationId): void { LocationController.enter(this.state, id); }
  interact(id: string): Hotspot {
    if (this.state.sessionState !== 'EXPLORING') throw new Error('Not exploring');
    const hotspot = InteractionSystem.get(this.state, id);
    if (hotspot.dialogue) DialogueController.open(this.state, hotspot.dialogue);
    else NarrativeEffects.apply(this.state, hotspot.effects ?? []);
    return hotspot;
  }
  choose(id: string): Choice { return DialogueController.choose(this.state, id); }
  closeDialogue(): void {
    if (this.state.sessionState !== 'DIALOGUE') return;
    this.state.sessionState = 'EXPLORING';
    this.state.currentDialogueId = null;
    this.state.dialoguePhase = null;
  }
}

/** Fail fast in development if a content edit leaves dangling IDs. No scripting language. */
export function validateContent(locations = LOCATIONS, dialogues = DIALOGUES): void {
  const interactions = locations.flatMap(location => location.hotspots);
  const completeIds = [...interactions.map(hotspot => hotspot.id), ...dialogues.map(dialogue => dialogue.id)];
  for (const collection of [locations.map(location => location.id), completeIds]) {
    if (new Set(collection).size !== collection.length) throw new Error('Duplicate content ID');
  }
  const checkConditions = (conditions: Condition[] = []) => {
    for (const condition of conditions) {
      if ('completed' in condition && !completeIds.includes(condition.completed)) throw new Error('Missing condition reference');
      if ('clue' in condition && !Object.hasOwn(CLUES, condition.clue)) throw new Error('Missing clue reference');
      if ('flag' in condition && !Object.hasOwn(initialState().flags, condition.flag)) throw new Error('Unknown flag');
    }
  };
  const checkEffects = (effects: Effect[] = []) => {
    for (const effect of effects) {
      if ('complete' in effect && !completeIds.includes(effect.complete)) throw new Error('Missing effect reference');
      if ('clue' in effect && !Object.hasOwn(CLUES, effect.clue)) throw new Error('Missing clue effect');
      if ('flag' in effect && !Object.hasOwn(initialState().flags, effect.flag)) throw new Error('Unknown flag effect');
    }
  };
  for (const location of locations) {
    checkConditions(location.when);
    for (const hotspot of location.hotspots) {
      checkConditions(hotspot.when); checkEffects(hotspot.effects);
      if (hotspot.dialogue && !dialogues.some(dialogue => dialogue.id === hotspot.dialogue && dialogue.location === location.id)) throw new Error('Missing dialogue reference');
    }
  }
  for (const dialogue of dialogues) {
    if (!locations.some(location => location.id === dialogue.location)) throw new Error('Missing dialogue location');
    if (new Set(dialogue.choices.map(choice => choice.id)).size !== dialogue.choices.length) throw new Error('Duplicate choice ID');
    dialogue.variants?.forEach(variant => checkConditions(variant.when));
    for (const choice of dialogue.choices) {
      checkConditions(choice.when); checkEffects(choice.effects);
      choice.variants?.forEach(variant => checkConditions(variant.when));
    }
  }
}

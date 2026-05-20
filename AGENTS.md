# Project Instructions

## Stack

- Angular 21.
- TypeScript strict mode everywhere.
- Prefer Angular Signals for local and shared reactive state.

## TypeScript

- Do not use `any`. Use precise types, generics, `unknown`, discriminated unions, or dedicated interfaces instead.
- Keep `strict` compatibility: no implicit `any`, no unsafe null access, no unchecked casts.
- Avoid broad type assertions. If an assertion is necessary, keep it local and explain why.
- Prefer readonly data structures when mutation is not required.

## Angular

- Prefer standalone components, signals, computed signals, effects, and signal inputs/outputs when they fit the use case.
- Avoid introducing RxJS for simple component state. Use RxJS only for streams where it is the established Angular or library contract, such as HTTP, router events, or external observable APIs.
- Keep templates simple. Move non-trivial logic into typed component methods, computed signals, or dedicated helpers.
- Use Angular control flow syntax (`@if`, `@for`, `@switch`) for new templates.

## Clean Code

- Keep changes small, focused, and consistent with the existing project structure.
- Prefer explicit names over comments. Add comments only for non-obvious decisions.
- Extract helpers only when they remove real duplication or clarify domain behavior.
- Keep components cohesive: UI rendering in components, reusable logic in services/helpers, domain types in dedicated model files when useful.
- Do not introduce new dependencies unless they clearly reduce complexity or are required by the task.

## Game Brief

The game is a minimalist text-first narrative roguelite and a prequel to a later tabletop RPG set in the same universe. It follows a young apprentice of the Académie du Temps during what first appears to be an ordinary day of classes, research, student routines, and quiet institutional secrets. The catastrophe begins when Thanatos attacks the academy, kills students and masters, and the apprentice wakes again at the exact start of the same day.

### Core Premise

- The academy studies a stable fissure in the temporal flow. It is not the continental Brèche, but a smaller anomaly that makes the location valuable and dangerous.
- Archimages are the great master mages of the forces that govern the world.
- Ethereal Archimages rule the four elements: water, air, earth, and fire.
- Primordial Archimages rule Time, Void, and Spirits. Avalh'ar is the Archimage of Time during this prequel era.
- The Supreme Archimage is considered the greatest mage in the world.
- Thanatos is a human prodigy trained from childhood by the Supreme Archimage. He is known in later accounts as the Disciple, and he mastered both mana and the forbidden discipline called the Fracture.
- Thanatos defeated and unanchored the Primordial Archimages of Time, Void, and Spirits before the Ethereal Archimages united against him.
- The Ethereal Archimages feared Thanatos after the fall of the Primordials. Their confrontation led him to unleash the Fracture at full strength, overloading mana and opening the continental Brèche.
- A desperate ritual sealed part of Thanatos's power into a receptacle weapon: the Épée de Thanatos. The sword is designed to contain and drain his magic, but it is uncertain whether it still holds what it absorbed.
- At the beginning, Thanatos is invincible. The player must investigate, remember, and prepare rather than fight directly.
- The final goal is not to destroy Thanatos, but to weaken or partially bind part of his power in a way that foreshadows the later sealing of his magic.
- The time-loop premise must not be named or explained before the player has already experienced the day once.

### Experience Goals

- Make the academy feel familiar first, then increasingly wrong as loops reveal what it hides.
- Build mystery through recurring details, altered scenes, missing characters, impossible deaths, and places that appear or disappear across timelines.
- Make repetition meaningful through changed wording, unlocked choices, persistent knowledge, and new routes through the same day.
- Keep choices short, readable, and consequential. A choice should move the player, alter resources, unlock knowledge, reveal a routine, affect a relationship, or express a clear risk.
- Favor mystery, melancholy, constant tension, progressive lore discovery, light cosmic horror, and the shift from helplessness to partial mastery.
- Do not over-explain mechanics in narrative text. The player should infer systems by observing changes.

### Core Gameplay

- The core loop is investigation across repeated timelines.
- The player explores academy spaces, observes students and professors, collects clues, learns schedules, unlocks forbidden rooms, studies temporal seals, and tests risky hypotheses.
- Some puzzles should require several loops: learn a routine in one loop, use it earlier in another, then unlock a hidden event or location.
- Thanatos should remain unbeatable early. Progress comes from understanding his origin, movements, weaknesses, relationship to the Fracture, and the possibility of using a receptacle or seal against part of his power.
- Alternative timelines are valid long-term content: academy already destroyed, early magical invasion, Thanatos victorious, or apprentice becoming an anomaly.

### Core Systems

- `player.hp` represents physical survival within the current day. If it reaches 0, the apprentice dies from wounds and immediately restarts at the beginning of the day. HP resets each loop.
- `player.sanity` is displayed as Esprit and represents mental fragmentation, not mental health. It rises when the apprentice abuses memory, witnesses impossible events, listens to echoes, or forces paradoxes. At the threshold, the apprentice goes mad and remains trapped by time forever.
- `player.corruption` represents exposure to Thanatos, unstable rituals, and forbidden temporal contamination. At the threshold, it ends the game with a Thanatos-strengthening ending. High corruption should also unlock tempting choices that lean into that fate.
- `player.insight` is displayed as Perception and represents understanding of time, the loop, routines, seals, and Thanatos. It should unlock informed choices that help weaken Thanatos.
- `player.loop` tracks the current run count and should be derived from persistent progression, not faked in UI.
- `meta.seenEvents` is persistent memory. Use it to vary text and unlock repeat-run behavior.
- `meta.discoveredTruths` stores persistent lore and investigation facts such as routines, hidden rooms, rituals, weaknesses, and identities.
- `meta.unlockedChoices` stores persistent capabilities or learned actions such as using a seal, anticipating an event, or manipulating a temporal lock.
- `meta.endingsSeen` stores major outcomes and should support future branches.

### Event Design Rules

- Every event must have a stable unique `id`.
- Every explicit `nextEventId` must target an existing event unless deliberately relying on sequence fallback.
- Conditional choices must be enforced by the engine and visually disabled by the UI.
- Avoid dead ends unless they intentionally end the run.
- A death can be progress if it grants a durable clue, truth, route, or ending marker.
- Do not store functions in saves. Saves must contain serializable state only; restore behavior from event IDs and static data.
- When adding mechanics, add focused tests for transitions, persistence, locked choices, and save hydration.

### Narrative Consistency

- Keep the academy as the initial grounded frame: courses, study rooms, corridors, archives, rituals, faculty, students, dormitories, courtyards, schedules, and institutional routine.
- Reveal supernatural and temporal concepts progressively. Early anomalies should feel like sensations, coincidences, fatigue, missing time, repeated phrases, misplaced objects, or impossible timing.
- Repeated events should not simply duplicate text. Use `seenEvents` and `discoveredTruths` to make later visits sharper, stranger, or more actionable.
- Some characters may seem to remember previous loops, but this should remain ambiguous until earned by investigation.
- The Échos are consciousness fragments lost in repeated timelines.
- Avalh'ar has not yet faced Thanatos. He is the Archimage of Time, expected to visit the academy within the week, and his theories, letters, and unfinished work can appear before he does.
- The ancient world once contained many peoples and races, including humans, ancient peoples, hybrid creatures, and lineages deeply infused with magic. Magic is natural in this era: it circulates through blood, land, cultures, seasons, harvests, and alliances.
- Do not introduce any in-world force, mark, ritual, or lore concept based on the later tabletop RPG title. That title belongs to future events, not to this prequel's diegesis.
- Choices unlocked by insight should feel like understanding, not like a generic stat gate.
- Avalh'ar's expected visit is meant to study a way to defeat or contain Thanatos. This visit must remain confidential and should not be common student knowledge.

### UI Direction

- Keep the UI minimal, dark, and discreet.
- Prioritize the current scene and choices over stats.
- The bottom bar should remain secondary: useful for state and run controls, never visually louder than the story.
- Do not add a marketing-style landing page. The first screen should remain the playable narrative surface.

## Verification

- Run the most relevant lint, type-check, or tests after code changes when available.
- If verification cannot be run, state why and identify the remaining risk.

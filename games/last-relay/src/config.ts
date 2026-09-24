export type Variant = 'standard' | 'runner' | 'heavy';
export type DefenceType = 'rapid' | 'heavy';
export type Lane = 0 | 1 | 2;
export const SETTINGS = { startingEnergy: 100, relayHP: 10, maxEnemies: 10, prepareSeconds: 7, completeSeconds: 2, fixedStep: 1 / 60, maxFrameDelta: .1, maxEffects: 64, tracerSeconds: .12, burstSeconds: .38, hitSeconds: .13, relayPulseSeconds: .45 } as const;
export const ENEMIES = {
  standard: { hp: 32, speed: .031, damage: 1, reward: 10, scale: 1, color: 0xff9b52 },
  runner: { hp: 21, speed: .04185, damage: 1, reward: 8, scale: .78, color: 0xffc078 },
  heavy: { hp: 78, speed: .02015, damage: 2, reward: 15, scale: 1.35, color: 0xe75658 },
} as const;
export const DEFENCES = {
  rapid: { cost: 50, damage: 8, cooldown: .5, rangeStart: .43 },
  heavy: { cost: 75, damage: 48, cooldown: 2.4, rangeStart: .39 },
} as const;
export interface Spawn { at: number; lane: Lane; variant: Variant }
export interface Wave { title: string; hpScale: number; spawns: Spawn[] }
// Each token is lane (1–3) + variant (s/r/h). Timing and formations are data.
const formation = (title: string, interval: number, hpScale: number, tokens: string): Wave => ({
  title, hpScale, spawns: tokens.split(' ').map((token, i) => ({ at: i * interval, lane: (Number(token[0]) - 1) as Lane, variant: ({ s: 'standard', r: 'runner', h: 'heavy' } as const)[token[1] as 's' | 'r' | 'h'] })),
});
export const WAVES: Wave[] = [
  formation('First contact', 2.8, 1, '1s 2s 1r 2s 3s 3r'),
  formation('Signal hunters', 2.4, 1, '3s 1s 2r 3r 1s 2s 1r 3s'),
  formation('Armoured approach', 2.1, 1, '2h 1s 3r 2s 1r 3s 2r 1s 3h 2s'),
  formation('Broken perimeter', 1.9, 1.08, '1h 2r 3s 1s 2s 3r 2h 1r 3s 1s 2r 3h'),
  formation('Crossfire', 1.8, 1.16, '3h 2s 1r 3s 2r 1h 3r 2s 1s 2h 3s 1r 2r 3h'),
  formation('Machine tide', 1.7, 1.25, '1r 2r 3h 1h 2s 3r 1s 2h 3s 1r 2s 3h 1s 2r 3r 1h'),
  formation('No reply', 1.6, 1.34, '2h 3h 1r 2s 3r 1h 2r 3s 1s 2h 3r 1r 2s 3h 1h 2r 3s 1s'),
  formation('Critical frequency', 1.5, 1.43, '1h 2h 3r 1s 2r 3h 1r 2s 3s 1h 2r 3h 1s 2h 3r 1r 2s 3s 1h 2h'),
  formation('Last line', 1.4, 1.52, '3h 1h 2r 3s 1r 2h 3r 1s 2s 3h 1r 2h 3s 1h 2r 3r 1s 2h 3h 1r 2s 3s'),
  formation('Keep transmitting', 1.3, 1.65, '1h 2h 3h 1r 2r 3r 1s 2h 3s 1h 2r 3h 1r 2s 3r 1h 2h 3s 1r 2r 3h 1s 2h 3r 1h 2h'),
];

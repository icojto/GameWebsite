export interface RecordData { reduced: boolean; bestWave: number; bestKills: number; victory: boolean }
const defaults = (): RecordData => ({ reduced: false, bestWave: 0, bestKills: 0, victory: false });
export function readRecord(storage?: Pick<Storage, 'getItem'>): RecordData {
  try {
    const value = JSON.parse((storage ?? localStorage).getItem('last-relay-v1') ?? '{}');
    const integer = (v: unknown, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : 0;
    return { reduced: value.reduced === true, bestWave: integer(value.bestWave, 10), bestKills: integer(value.bestKills, 10000), victory: value.victory === true };
  } catch { return defaults(); }
}
export function saveRecord(value: RecordData, storage?: Pick<Storage, 'setItem'>) { try { (storage ?? localStorage).setItem('last-relay-v1', JSON.stringify(value)); } catch { /* Storage is optional. */ } }

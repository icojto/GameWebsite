export const qaSession: string | null;
export const gameRandom: () => number;
export const gameStorage: { scope: string; getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void; resetSession():void; readonly available:boolean };
export function scopedUrl(value:string):string;

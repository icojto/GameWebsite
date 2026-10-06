/** Fixed QA setup stream; never replace global Math.random. */
export function seededRandom(seed=41) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
}

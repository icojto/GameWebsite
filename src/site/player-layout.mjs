/** Reserve actual action-bar height; never impose a floor larger than the viewport. */
export function playerAllocation(viewportHeight, actionHeight, stageTop = 0, bottomInset = 0) {
  return Math.max(0, Math.floor(viewportHeight - stageTop - actionHeight - bottomInset));
}

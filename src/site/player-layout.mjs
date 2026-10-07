/** Reserve actual action-bar height; never impose a floor larger than the viewport. */
export function playerAllocation(viewportHeight, actionHeight) {
  return Math.max(0, Math.floor(viewportHeight - actionHeight - 16));
}

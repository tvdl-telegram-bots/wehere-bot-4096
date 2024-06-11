const STEPS = 8;
const MAX_CONTAINER_WIDTH = 800;
const MIN_PIECE_WIDTH = 100;

// 107, 117, 128, 139, 152, 165, 181, 197, 215, 234, 256, 279, 304, 331, 362, 394, 430, 469, 512, 558, 608, 663, 724, 789
const STOPS = Array.from(Array(MAX_CONTAINER_WIDTH), (_, i) => i + 1)
  .map((x) => Math.floor(Math.log2(x) * STEPS))
  .map((k) => Math.floor(Math.pow(2, k / STEPS)))
  .filter((_, i, a) => !i || a[i] !== a[i - 1])
  .filter((w) => w >= MIN_PIECE_WIDTH);
export const POSSIBLE_PIECE_WIDTHS = STOPS;

const RATIO = 0.8;

export function getOptimalPieceWidth(
  containerWidth: number | undefined
): number | undefined {
  if (!containerWidth) return undefined;
  const maxPieceWidth = containerWidth * RATIO;
  const optimalPieceWidth = STOPS.findLast((x) => x <= maxPieceWidth);
  return optimalPieceWidth || MIN_PIECE_WIDTH;
}

export function getPartialSums(items: number[]): number[] {
  const result = [0];
  items.forEach((value, index) => result.push(result[index] + value));
  return result;
}

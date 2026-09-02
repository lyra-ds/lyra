export function isDeepStrictEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function iterateChunks<T>(size: number, arr: T[]) {
  return Array(Math.ceil(arr.length / size))
    .fill(null)
    .map((_, index) => arr.slice(index * size, (index + 1) * size));
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

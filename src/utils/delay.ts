export function resolveAfter<T>(delayMs: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => promise.then(resolve).catch(reject), delayMs);
  });
}

export async function delayMs(ms: number) {
  await resolveAfter(ms, Promise.resolve());
}

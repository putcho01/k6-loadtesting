const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(length: number, charset = ALPHANUMERIC): string {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset.charAt(randomIntBetween(0, charset.length - 1));
  }
  return result;
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomIntBetween(0, items.length - 1)];
}

export function parseJson<T>(body: string | ArrayBuffer | null): T {
  return JSON.parse(String(body)) as T;
}

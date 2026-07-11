import type { Options } from 'k6/options';

// 全テスト共通のデフォルト閾値。テストごとに上書き・追加できる。
export const defaultThresholds: Options['thresholds'] = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1000'],
};

export const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

// シナリオ内での sleep() に使う基準値（秒）
export const THINK_TIME_SECONDS = 1;

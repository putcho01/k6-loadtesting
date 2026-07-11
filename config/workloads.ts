import type { Options } from 'k6/options';

export type WorkloadName = 'smoke' | 'load' | 'stress' | 'spike' | 'soak';

// 各負荷パターンの stages/vus 定義。
// https://grafana.com/blog/organizing-your-grafana-k6-performance-testing-suite-best-practices-to-get-started/
// で紹介されている、負荷パターンを設定として切り出す構成に倣っている。
const workloads: Record<WorkloadName, Pick<Options, 'vus' | 'duration' | 'stages'>> = {
  // 最小構成で疎通確認するためのパターン
  smoke: {
    vus: 1,
    duration: '30s',
  },
  // 想定される平常時トラフィックを一定時間かけ続けるパターン
  load: {
    stages: [
      { duration: '2m', target: 20 },
      { duration: '5m', target: 20 },
      { duration: '2m', target: 0 },
    ],
  },
  // システムの限界点を探るため、段階的に負荷を上げ続けるパターン
  stress: {
    stages: [
      { duration: '2m', target: 20 },
      { duration: '5m', target: 20 },
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '5m', target: 0 },
    ],
  },
  // 急激なアクセス増加への耐性を確認するパターン
  spike: {
    stages: [
      { duration: '10s', target: 5 },
      { duration: '1m', target: 5 },
      { duration: '10s', target: 200 },
      { duration: '3m', target: 200 },
      { duration: '10s', target: 5 },
      { duration: '3m', target: 5 },
      { duration: '10s', target: 0 },
    ],
  },
  // 長時間の負荷継続によるメモリリーク等を検出するパターン
  soak: {
    stages: [
      { duration: '2m', target: 20 },
      { duration: '3h56m', target: 20 },
      { duration: '2m', target: 0 },
    ],
  },
};

export function getWorkload(name: WorkloadName): Pick<Options, 'vus' | 'duration' | 'stages'> {
  return workloads[name];
}

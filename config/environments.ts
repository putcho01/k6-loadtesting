export type EnvironmentName = 'local' | 'dev' | 'staging' | 'production';

export interface EnvironmentConfig {
  // QuickPizza はページと API を同一オリジンで提供するため、baseUrl のみを保持する。
  // API クライアントのパス（例: /api/users）は呼び出し側で付与する。
  baseUrl: string;
}

// QuickPizza (https://github.com/grafana/quickpizza) は Grafana が公開している
// 負荷試験デモ用アプリ。dev/staging/production はこのテンプレートの動作確認用に
// 同じ公開インスタンスを指しているため、実プロジェクトに適用する際は
// 環境ごとの実際のエンドポイントに差し替えること。
// quickpizza.grafana.com は小規模な負荷試験向けの公開環境のため、
// smoke 以外（load/stress 等）は自前でデプロイした環境や docker で
// 起動した local 環境に対して実行すること。
const environments: Record<EnvironmentName, EnvironmentConfig> = {
  local: {
    baseUrl: 'http://localhost:3333',
  },
  dev: {
    baseUrl: 'https://quickpizza.grafana.com',
  },
  staging: {
    baseUrl: 'https://quickpizza.grafana.com',
  },
  production: {
    baseUrl: 'https://quickpizza.grafana.com',
  },
};

export function getEnvironment(): EnvironmentConfig {
  const name = (__ENV.ENVIRONMENT || 'dev') as EnvironmentName;
  const config = environments[name];
  if (!config) {
    throw new Error(
      `Unknown ENVIRONMENT "${name}". Valid options: ${Object.keys(environments).join(', ')}`,
    );
  }
  return config;
}

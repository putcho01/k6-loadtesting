# 自分たちのプロジェクトに適用する手順

このリポジトリはデフォルトで Grafana 公開の [QuickPizza](https://github.com/grafana/quickpizza) を対象に動くようになっています。
自分たちの Web アプリ / API を対象に負荷試験基盤として使うには、以下の4ステップで QuickPizza 向けの設定を実プロジェクトのものに置き換えます。

**前提**: [README.md](../README.md#クイックスタート) のクイックスタート（`mise install` → `mise run setup` → `mise run test:smoke`）が完了していること。

## 全体の流れ

1. [環境ごとの URL を設定する](#1-環境ごとの-url-を設定する-configenvironmentsts)
2. [API クライアントを実装する](#2-api-クライアントを実装する-libclients)
3. [負荷パターンを調整する](#3-負荷パターンを調整する-configworkloadsts)
4. [シナリオ・テストを作成する](#4-シナリオテストを作成する-scenarios-tests)
5. [動作確認する（誰でも実行できる状態にする）](#5-動作確認する誰でも実行できる状態にする)

---

## 1. 環境ごとの URL を設定する（[config/environments.ts](../config/environments.ts)）

`environments` オブジェクトの `baseUrl` を、実際の staging / production の URL に書き換えます。

```ts
const environments: Record<EnvironmentName, EnvironmentConfig> = {
  local: {
    baseUrl: 'http://localhost:3333', // 手元で起動する開発サーバー
  },
  dev: {
    baseUrl: 'https://dev.example.com',
  },
  staging: {
    baseUrl: 'https://staging.example.com',
  },
  production: {
    baseUrl: 'https://example.com',
  },
};
```

- API キーや Basic 認証などクエリ以外の環境固有情報が必要な場合は、`EnvironmentConfig` にフィールドを追加してください（例: `apiKey: string`）。
- `getEnvironment()` は `__ENV.ENVIRONMENT`（未指定時は `dev`）を見て設定を返します。値は [.github/workflows/run-load-test.yml](../.github/workflows/run-load-test.yml) のドロップダウンや `ENVIRONMENT=staging mise run test:load` のように指定します。

**verify**: `mise run typecheck` が通ること。

## 2. API クライアントを実装する（[lib/clients/](../lib/clients/)）

`lib/clients/base-client.ts` の `BaseClient` は GET/POST/PUT/PATCH/DELETE と JSON ヘッダ付与を共通化した基底クラスです。そのまま使えます。
`lib/clients/api-client.ts`（`QuickPizzaApiClient`）を参考に、`BaseClient` を継承した自分たちの API クライアントを新規作成します。

```ts
// lib/clients/my-api-client.ts
import { BaseClient } from './base-client.ts';

export interface Order {
  id?: number;
  itemId: number;
  quantity: number;
}

export class MyApiClient extends BaseClient {
  createOrder(order: Order) {
    return this.post('/api/orders', order);
  }

  getOrder(id: number) {
    return this.get(`/api/orders/${id}`);
  }
}
```

QuickPizza 向けの `lib/clients/api-client.ts` と `scenarios/apis/user-api.ts` は不要になったら削除して構いません。実装の型として残しておいても害はありません。

**verify**: `mise run typecheck` が通ること。

## 3. 負荷パターンを調整する（[config/workloads.ts](../config/workloads.ts)）

`smoke` / `load` / `stress` / `spike` / `soak` の `vus` / `stages` を、想定する実トラフィックに合わせて調整します。

- `load`: 平常時の同時接続数・継続時間の実績値やSLO目標から決める
- `stress`: `load` の目標値を上回るところまで段階的に上げ、限界点を探れる幅にする
- 必要であれば [config/settings.ts](../config/settings.ts) の `defaultThresholds`（`http_req_failed` / `http_req_duration`）も自分たちの SLO に合わせて上書きする

`smoke` は疎通確認用なので基本的に変更不要です（1 VU・短時間のまま）。

**verify**: `mise run typecheck` が通ること。

## 4. シナリオ・テストを作成する（`scenarios/` / `tests/`）

1. `scenarios/` に、手順2で作った API クライアント（または画面遷移）を使う業務シナリオを追加します。既存の [scenarios/e2e/simple-page-view.ts](../scenarios/e2e/simple-page-view.ts)・[scenarios/apis/user-api.ts](../scenarios/apis/user-api.ts) を雛形にしてください。
2. `tests/<test_type>/` に、`config/workloads.ts` の負荷パターンとシナリオを組み合わせたテストファイルを追加します。

具体的な追加手順・雛形は README の [新しいテストを追加する](../README.md#新しいテストを追加する) にまとまっているので、そちらに従ってください。

**verify**: `mise exec -- k6 run tests/<test_type>/xxx-test.ts` がローカルで実行でき、checks が失敗しないこと。

## 5. 動作確認する（誰でも実行できる状態にする）

1. ローカルで一通り実行する。

   ```bash
   mise run test:smoke
   ENVIRONMENT=staging mise run test:load
   ```

2. GitHub Actions の **Run Load Test** ワークフローを `workflow_dispatch` で実行し、`test_type` / `environment` のドロップダウンから1クリックで動くことを確認する（[README.md#github-actions-で実行する誰でも1クリック](../README.md#github-actions-で実行する誰でも1クリック)）。
   - `spike` / `soak` など `tests/` に新しい test_type ディレクトリを追加した場合は、[run-load-test.yml](../.github/workflows/run-load-test.yml) の `test_type` の `options` にも追加してください。
3. AWS 上での大規模・分散実行が必要な場合は [docs/aws-distributed-load-testing.md](aws-distributed-load-testing.md) を参照してください。

---

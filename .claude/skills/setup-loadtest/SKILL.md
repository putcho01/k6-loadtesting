---
name: setup-loadtest
description: |
  k6-loadtesting テンプレート（QuickPizza デモ向け構成）を、ユーザー自身のプロジェクト向けに対話形式でセットアップするウィザード。
  docs/DEVELOPMENT.md の手順（環境URL設定・APIクライアント実装・負荷パターン調整・シナリオ/テスト作成・動作確認）を、
  ユーザーに1ステップずつ質問しながら進め、回答に基づいて config/environments.ts・config/workloads.ts・
  lib/clients/・scenarios/・tests/ を編集する。
  以下の場合に使用すること:
  - ユーザーが「このテンプレートをセットアップして」「自分のプロジェクト用に設定したい」と言った場合
  - ユーザーが「/setup-loadtest」と入力した場合
  - ユーザーが「DEVELOPMENT.mdの手順を進めて」「負荷試験基盤を初期構築したい」と言った場合
  - 新しい環境（別のWebアプリ/API）向けにこのk6テンプレートを流用したいと言った場合
---

# setup-loadtest スキル

`k6-loadtesting` テンプレートはデフォルトで QuickPizza（Grafana の負荷試験デモアプリ）を対象に動く。
このスキルは [docs/DEVELOPMENT.md](../../../docs/DEVELOPMENT.md) の5ステップを、実際にユーザーへ質問しながら1つずつ進め、
回答に基づいてファイルを編集する対話形式のセットアップウィザードである。

## 進め方の原則

- **必ず質問してから編集する。** 各ステップで何を聞くべきかは後述の通り。URL・エンドポイント一覧・VU数のような自由記述は
  チャット上で直接質問して回答を待つ（`AskUserQuestion` は選択肢が自然な設問――「進める/スキップする」「追加フィールドの有無」など――にのみ使う）。
  推測でダミー値を埋めない。
- **スキップしたステップのファイルは触らない。** ユーザーが「あとで」「スキップ」と言ったら、そのステップに関するファイルは
  QuickPizza 向けの元の状態のまま残し、最終サマリーで「未設定」として明示する。中途半端なプレースホルダー値で埋めない。
- **編集前に対象ファイルを Read する。** 差分編集（Edit）を行うため、書き換える前に必ず現在の内容を読むこと。
  以下の「現状のテンプレート」セクションはこのスキル作成時点のスナップショットであり、実際の内容と差分がある可能性がある。
- **各ステップ後に検証する。** ファイルを編集したら `mise run typecheck` を実行し、成功/失敗をユーザーに一言で報告する。
  失敗した場合は原因を特定してから次のステップに進む。
- 1つのステップの質問は一度に詰め込みすぎない。ステップごとに区切り、都度結果を短く報告してから次へ進む。

## ステップ0: 開始確認

ユーザーに、5ステップ（環境URL → APIクライアント → 負荷パターン → シナリオ/テスト → 動作確認）を順番に進めることを伝え、
「途中のステップは `AskUserQuestion` でスキップ可能」であることを一言添えてから開始する。

---

## ステップ1: 環境URLの設定（[config/environments.ts](../../../config/environments.ts)）

### 質問すること

1. （自由記述で）staging と production の baseURL を尋ねる。例:「staging と production のベースURL（例: `https://staging.example.com`）を教えてください。まだ決まっていなければ『スキップ』と答えてください」
2. dev / local も QuickPizza 以外に向けたいか（多くの場合 local はそのまま `http://localhost:3333` でよい）
3. `AskUserQuestion` で、baseUrl 以外の環境固有情報（APIキー、Basic認証など）が必要かを聞く。必要なら具体的なフィールド名と型を自由記述で聞く。

### 編集内容

`config/environments.ts` の `environments` オブジェクトの該当環境の `baseUrl` を回答値に置き換える。追加フィールドが必要な場合は
`EnvironmentConfig` インターフェースにフィールドを追加し、各環境エントリにも値を設定する（未回答の環境は既存値のまま残す）。

現状のテンプレート（差分編集の起点として、必ず実ファイルを Read してから編集すること）:

```ts
export interface EnvironmentConfig {
  baseUrl: string;
}

const environments: Record<EnvironmentName, EnvironmentConfig> = {
  local: { baseUrl: 'http://localhost:3333' },
  dev: { baseUrl: 'https://quickpizza.grafana.com' },
  staging: { baseUrl: 'https://quickpizza.grafana.com' },
  production: { baseUrl: 'https://quickpizza.grafana.com' },
};
```

### 検証

`mise run typecheck` を実行して報告する。

---

## ステップ2: APIクライアントの実装（[lib/clients/](../../../lib/clients/)）

### 質問すること

1. `AskUserQuestion`: 「新しい API クライアントをこの場で雛形生成しますか？」（進める / あとでスキップ）
2. 進める場合、自由記述で以下を聞く:
   - クライアント名（例: `MyApiClient`）
   - 叩きたいエンドポイントの一覧（メソッド・パス・簡単な説明。例: `POST /api/orders 注文作成` `GET /api/orders/:id 注文取得`）
3. `AskUserQuestion`: QuickPizza 専用の `lib/clients/api-client.ts` と `scenarios/apis/user-api.ts` を「今すぐ削除する / 参考として残す」のどちらにするか

### 編集内容

`lib/clients/base-client.ts` の `BaseClient`（`get`/`post`/`put`/`patch`/`delete` を持つ）を継承した新規ファイルを
`lib/clients/<name>-client.ts` として作成する。1エンドポイント=1メソッドで実装し、リクエスト/レスポンスの型が
聞き取れていれば `interface` を定義する。既存の `lib/clients/api-client.ts`（`QuickPizzaApiClient`）を書き方の見本にする:

```ts
// lib/clients/api-client.ts（見本）
import { BaseClient, type RequestOptions } from './base-client.ts';

export class QuickPizzaApiClient extends BaseClient {
  registerUser(credentials: Credentials) {
    return this.post('/api/users', credentials);
  }
  getPizzaRecommendation(token: string, restrictions: PizzaRestrictions = {}) {
    return this.post('/api/pizza', restrictions, this.withAuth(token));
  }
  private withAuth(token: string): RequestOptions {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}
```

ユーザーが削除を選んだ場合のみ `lib/clients/api-client.ts` と `scenarios/apis/user-api.ts`、およびそれを import している
`tests/*/demo-*-test.ts` 内の該当行を削除する。ユーザーが「あとで」を選んだ場合はこのステップのファイルには一切触れない。

### 検証

新規クライアントファイルを作った場合は `mise run typecheck` を実行して報告する。

---

## ステップ3: 負荷パターンの調整（[config/workloads.ts](../../../config/workloads.ts) / [config/settings.ts](../../../config/settings.ts)）

### 質問すること

1. 自由記述:「平常時（load）で想定する同時接続数（VU数）とその負荷を維持する時間を教えてください。わからなければ現状維持でも構いません」
2. `AskUserQuestion`: stress パターンの上限も一緒に見直すか（load の想定値に応じて上限を引き上げる / smoke同様そのままにする）
3. `AskUserQuestion`: 閾値（`config/settings.ts` の `defaultThresholds`: `http_req_failed` のエラー率上限、`http_req_duration` のp95）を
   自分たちの SLO に合わせて変更するか

### 編集内容

`config/workloads.ts` の該当パターン（`load`、必要なら `stress`）の `vus`/`stages` を回答値に基づいて書き換える。
既存の `stages` の形（ランプアップ→維持→ランプダウン）を踏襲する:

```ts
load: {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '5m', target: 20 },
    { duration: '2m', target: 0 },
  ],
},
```

閾値変更が必要な場合は `config/settings.ts` の `defaultThresholds` を編集する:

```ts
export const defaultThresholds: Options['thresholds'] = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1000'],
};
```

回答がなかったパターン・閾値は変更しない。

### 検証

`mise run typecheck` を実行して報告する。

---

## ステップ4: シナリオ・テストの作成（[scenarios/](../../../scenarios/) / [tests/smoke/](../../../tests/smoke/)）

### 質問すること

1. `AskUserQuestion`: 「業務シナリオ（実ユーザーの一連の操作）を1つ作成しますか？」（作成する / あとでスキップ）
2. 作成する場合、自由記述で「そのシナリオの流れ（画面遷移やAPI呼び出しの順序）」を聞く。ステップ2でクライアントを作った場合は
   それを使うことを前提に聞く（例:「注文フローなら: 商品一覧取得 → 注文作成 → 注文詳細取得、のように教えてください」）。

### 編集内容

`scenarios/` 配下（`scenarios/e2e/` か `scenarios/apis/` の慣習に沿ったディレクトリ、または新規サブディレクトリ）に、
聞き取ったシナリオを実装する関数を1ファイルとして作成する。既存の `scenarios/apis/user-api.ts` を見本にする:

```ts
import { check, group, sleep } from 'k6';
import { getEnvironment } from '../../config/environments.ts';
import { THINK_TIME_SECONDS } from '../../config/settings.ts';

export function myScenario(): void {
  const { baseUrl } = getEnvironment();
  // ステップ2で作ったクライアントがあればここでインスタンス化して使う
  group('...', () => {
    // ...
    check(res, { '... status is 200': (r) => r.status === 200 });
  });
  sleep(THINK_TIME_SECONDS);
}
```

続けて `tests/smoke/` 配下に、そのシナリオと `getWorkload('smoke')` を組み合わせたテストファイルを追加する。
既存の `tests/smoke/demo-smoke-test.ts` を見本にする:

```ts
import type { Options } from 'k6/options';
import { getWorkload } from '../../config/workloads.ts';
import { defaultThresholds } from '../../config/settings.ts';
import { myScenario } from '../../scenarios/.../my-scenario.ts';

export const options: Options = {
  ...getWorkload('smoke'),
  thresholds: defaultThresholds,
  tags: { test_type: 'smoke' },
};

export default function (): void {
  myScenario();
}
```

ユーザーが「あとで」を選んだ場合は `scenarios/` `tests/` に一切ファイルを追加しない。

### 検証

作成した場合は `mise run typecheck` を実行して報告する。

---

## ステップ5: 動作確認とサマリー

1. ステップ4で新規テストファイルを作った場合、`mise exec -- k6 run tests/smoke/<新規ファイル>.ts` を実行し、結果（checks の成功/失敗）をユーザーに報告する。
   作らなかった場合は `mise run test:smoke`（既存の QuickPizza 向けデモテスト）を代わりに実行してよいかユーザーに確認してから実行する。
2. 最後に、以下の形式で「設定済み / 未設定（プレースホルダーのまま）」のチェックリストを提示して締めくくる。

```
## セットアップ結果

- [x] config/environments.ts: staging/production の URL を設定した
- [ ] lib/clients/: 新規APIクライアントは未作成（QuickPizza向けの api-client.ts が残っています）
- [x] config/workloads.ts: load を 50 VU / 10分維持 に調整した
- [x] scenarios/ + tests/smoke/: 注文フローのシナリオとテストを作成した
- mise run typecheck: 成功
- mise exec -- k6 run tests/smoke/order-flow-test.ts: 成功（checks 100%）

未設定の項目は README.md / docs/DEVELOPMENT.md の該当ステップを参照して後から追加できます。
```

GitHub Actions（1クリック実行）や AWS Distributed Load Testing での実行は、このスキルの対象外。
必要であれば [README.md](../../../README.md#github-actions-で実行する誰でも1クリック) と
[docs/aws-distributed-load-testing.md](../../../docs/aws-distributed-load-testing.md) を案内する。

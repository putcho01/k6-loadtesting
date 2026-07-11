# k6-loadtesting

[k6](https://github.com/grafana/k6) を用いた負荷試験基盤サンプルレポジトリです。


## 指示
k6 を利用した負荷試験基盤サンプルを整備してください
[Grafana k6のベストプラクティス](https://grafana.com/blog/organizing-your-grafana-k6-performance-testing-suite-best-practices-to-get-started/)に沿った構成にすること

### 要件
- ローカルでの負荷試験を行うことができること
- AWS Distributed Load Testingで実行できる・手順が記載されていること

### その他
- 誰でも負荷試験が行えるように、ハードルが下がるようなものにすること
  - Actions で1クリック実行/resuable workflow による共通化
  - 手順がわかりやすく簡潔な文章のドキュメント整備
など

## コマンド
mise でツール・コマンドの両方を管理しています。実行コマンドはすべて [mise.toml](mise.toml) に `mise run <task>` として定義済みです（`setup` / `test:smoke` / `test:load` / `test:stress` / `build` / `typecheck`）。シェルの `mise activate` 設定に関わらず、mise が管理するバージョンの node/k6/pnpm を解決して実行されます。使い方の詳細は [README.md](README.md) を参照してください。

## ディレクトリ構成
```
.
├── config/                       # 設定ファイル
│   ├── workloads.ts               # 負荷パターン設定（smoke/load/stress/spike/soak）
│   ├── environments.ts            # 環境別設定（local/dev/staging/production）
│   └── settings.ts                # 共通設定（閾値・デフォルトヘッダー等）
├── scenarios/                    # 再利用可能なシナリオ
│   ├── e2e/simple-page-view.ts    # ページ閲覧シナリオ
│   └── apis/user-api.ts           # ユーザー登録〜APIのCRUDシナリオ
├── tests/                        # 実際のテストファイル
│   ├── smoke/demo-smoke-test.ts
│   ├── load/demo-load-test.ts
│   └── stress/demo-stress-test.ts
├── lib/                          # 再利用可能なモジュール
│   ├── clients/                   # APIクライアント
│   │   ├── base-client.ts
│   │   └── api-client.ts
│   └── utils/helpers.ts           # ユーティリティ関数
├── scripts/build.mjs             # AWS DLT 向けにテストを単一JSへバンドルするスクリプト
├── docs/
│   ├── DEVELOPMENT.md             # 自分たちのプロジェクトへの適用手順
│   └── aws-distributed-load-testing.md  # AWSでの実行手順
├── .github/workflows/            # GitHub Actions（1クリック実行 / reusable workflow）
│   ├── run-load-test.yml
│   └── k6-reusable-test.yml
├── package.json / tsconfig.json / pnpm-lock.yaml / pnpm-workspace.yaml
├── mise.toml                     # ツールバージョン・mise run タスク定義
└── .gitignore
```

テスト対象はデフォルトで Grafana 公式の負荷試験デモアプリ [QuickPizza](https://github.com/grafana/quickpizza) の公開インスタンス（`quickpizza.grafana.com`）。実プロジェクトに適用する手順（環境URL・APIクライアント・負荷パターン・シナリオの差し替え）は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照。

## 特徴
- 負荷パターン: smoke/load/stress/spike/soakテストの設定
- Grafanaが推奨する構成を採用


## 設計原則
### モジュール型シナリオ: 再利用可能なシナリオを作成し、複数のテストで共有
### 単一目的テスト: 各テストは1つの目的に特化（環境・負荷パターンの組み合わせ）
### 設定の分離: 環境設定と負荷パターンを別ファイルで管理
### APIクライアントのカプセル化: バックエンドとの相互作用をクラスで抽象化
### タグの活用
リクエストやテストにタグを付けて、結果の分析を容易にします
```ts
export const options: Options = {
  tags: {
    test_type: 'smoke',
    environment: 'production',
    feature: 'user_management',
  },
};
```

### カスタムメトリクス
必要に応じてカスタムメトリクスを追加できます
```ts
import { Counter, Trend } from 'k6/metrics';

const loginSuccessCounter = new Counter('login_success');
const loginDuration = new Trend('login_duration');

// メトリクスの記録
loginSuccessCounter.add(1);
loginDuration.add(response.timings.duration);
```

## AWS Distributed Load Testingでの実行
ローカルでの動作確認が完了したら、AWS基盤で本格的な負荷試験を実行します。
具体的な手順（`mise run build` によるスクリプトのバンドル、Traffic Shape 設定時の注意点等）は [docs/aws-distributed-load-testing.md](docs/aws-distributed-load-testing.md) を参照。
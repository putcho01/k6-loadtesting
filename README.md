# k6-loadtesting

[k6](https://github.com/grafana/k6) と TypeScript を用いた負荷試験基盤サンプルレポジトリです。
[Grafana k6のベストプラクティス](https://grafana.com/blog/organizing-your-grafana-k6-performance-testing-suite-best-practices-to-get-started/)に沿って、設定・シナリオ・テストを分離した構成にしています。

デフォルトでは Grafana が公開している負荷試験デモ用アプリ [QuickPizza](https://github.com/grafana/quickpizza) を対象にしているため、セットアップ後すぐに動かして確認できます。

## このリポジトリでできること

### 負荷パターン（[config/workloads.ts](config/workloads.ts)）

| パターン | 内容 | どんな時に使うか |
|---|---|---|
| smoke | 1 VU で30秒だけ実行 | 最小構成での疎通確認（まずこれを実行する） |
| load | 20 VUs まで2分でランプアップ→5分維持→2分でランプダウン | 想定される平常時トラフィックの再現 |
| stress | 20→50→100 VUs と段階的に負荷を上げる（計約26分） | システムの限界点（どこから性能劣化するか）を探る |
| spike | 5→200→5 VUs と短時間で急増・急減させる | 突発的なアクセス集中への耐性を確認する |
| soak | 20 VUs を約4時間維持 | 長時間稼働によるメモリリーク等の劣化を検出する |

このうち **smoke / load / stress** の3つは [tests/](tests/) 配下にすぐ実行できるテストとして用意済み。spike / soak も設定自体は定義済みなので、同じ要領で `tests/` にテストファイルを追加すればすぐ使える（[新しいテストを追加する](#新しいテストを追加する)を参照）。

### シナリオ（[scenarios/](scenarios/)）

各テストは、以下の再利用可能なシナリオを組み合わせて実行する。

- **ページ閲覧**（[e2e/simple-page-view.ts](scenarios/e2e/simple-page-view.ts)）: トップページと軽量なデータ取得を閲覧する、単純なユーザー行動を再現
- **API CRUD**（[apis/user-api.ts](scenarios/apis/user-api.ts)）: ユーザー登録 → ログイン → ピザのレコメンド取得 → 評価の作成・更新・削除、という一連のAPI利用の流れを再現

### 実行方法は3通り

- **ローカル**: `mise run test:smoke` 等で手元のマシンから実行（[テストの実行](#テストの実行)）
- **GitHub Actions**: Actionsタブから1クリックで実行。test_type/environmentを選ぶだけ（[GitHub Actions で実行する](#github-actions-で実行する誰でも1クリック)）
- **AWS Distributed Load Testing**: 複数リージョン・大規模な同時接続数で分散実行（[AWS Distributed Load Testing での実行](#aws-distributed-load-testing-での実行)）

対象システムはデフォルトで QuickPizza の公開インスタンス（`quickpizza.grafana.com`）だが、[config/environments.ts](config/environments.ts) を書き換えれば自分たちの Web アプリ / API を対象にできる。

## 必要なもの

[mise](https://mise.jdx.dev/) がインストールされていれば十分です。k6 / Node.js / pnpm のバージョンは [mise.toml](mise.toml) で固定されています。

## クイックスタート

```bash
mise install         # k6 / Node.js / pnpm をインストール
mise run setup       # 依存パッケージをインストール
mise run test:smoke  # smoke テストを実行
```

コマンドはすべて `mise run <task>` として定義してある（[mise.toml](mise.toml)）。`mise run` はシェルに `mise activate` を設定していなくても、mise が管理するバージョンの node/k6/pnpm を自動で解決して実行するため、`k6: command not found` のような PATH 起因のエラーを気にしなくてよい。

## ディレクトリ構成

```
.
├── config/                          # 設定ファイル
│   ├── environments.ts              # 環境別設定（local/dev/staging/production）
│   ├── workloads.ts                 # 負荷パターン設定（smoke/load/stress/spike/soak）
│   └── settings.ts                  # 共通設定（閾値・デフォルトヘッダー等）
├── scenarios/                       # 再利用可能なシナリオ
│   ├── e2e/simple-page-view.ts      # ページ閲覧シナリオ
│   └── apis/user-api.ts             # ユーザー登録〜APIのCRUDシナリオ
├── tests/                           # 実際に実行するテストファイル
│   ├── smoke/demo-smoke-test.ts
│   ├── load/demo-load-test.ts
│   └── stress/demo-stress-test.ts
├── lib/                             # 再利用可能なモジュール
│   ├── clients/                     # APIクライアント
│   │   ├── base-client.ts
│   │   └── api-client.ts
│   └── utils/helpers.ts             # ユーティリティ関数
├── scripts/build.mjs                # AWS DLT 向けにテストを単一JSへバンドルするスクリプト
├── docs/aws-distributed-load-testing.md  # AWSでの実行手順
└── .github/workflows/               # GitHub Actions
    ├── run-load-test.yml            # workflow_dispatch（1クリック実行）
    └── k6-reusable-test.yml         # reusable workflow
```

## テストの実行

```bash
mise run test:smoke   # tests/smoke/demo-smoke-test.ts
mise run test:load     # tests/load/demo-load-test.ts
mise run test:stress   # tests/stress/demo-stress-test.ts
```

対象環境を切り替える場合は `ENVIRONMENT` を指定する（未指定時は `dev` = quickpizza.grafana.com）。

```bash
ENVIRONMENT=local mise run test:load
```

k6 の CLI オプション（`--vus` や `--duration` での上書き等）をそのまま使いたい場合は、mise 経由で `k6 run` を直接実行しても良い。

```bash
mise exec -- k6 run tests/smoke/demo-smoke-test.ts
```

型チェックのみ行う場合:

```bash
mise run typecheck
```

> **k6 は TypeScript をネイティブ実行できる**ため、ローカルではビルド不要で `.ts` ファイルをそのまま `k6 run` できる。ただし相対 import は `./sub/mod.ts` のように拡張子を明示する必要がある点に注意（このリポジトリのコードは対応済み）。

## GitHub Actions で実行する（誰でも1クリック）

1. リポジトリの **Actions** タブを開く
2. **Run Load Test** ワークフローを選択し、**Run workflow** をクリック
3. `test_type`（smoke/load/stress）と `environment`（dev/staging/production）をドロップダウンから選んで実行

構成:
- [`run-load-test.yml`](.github/workflows/run-load-test.yml): 1クリック実行用の入口（`workflow_dispatch`）
- [`k6-reusable-test.yml`](.github/workflows/k6-reusable-test.yml): 実際にk6を実行する reusable workflow（`workflow_call`）。他のワークフローからも `uses:` で呼び出して共通化できる

## AWS Distributed Load Testing での実行

大規模・分散した負荷試験が必要な場合は [docs/aws-distributed-load-testing.md](docs/aws-distributed-load-testing.md) を参照してください。

## 新しいテストを追加する

1. 必要であれば `scenarios/` に再利用可能なシナリオを追加（既存シナリオを再利用しても良い）
2. `tests/<test_type>/` に、`config/workloads.ts` の負荷パターンとシナリオを組み合わせたテストファイルを追加
3. `mise exec -- k6 run tests/<test_type>/xxx-test.ts` でローカル確認
4. 複数ファイルを一気に実行したい場合は `package.json` の scripts や Actions workflow の `path` にファイルを追加

## 設計原則

- **モジュール型シナリオ**: `scenarios/` の VU 挙動を複数のテストから共有する
- **単一目的テスト**: 各テストは環境・負荷パターンの組み合わせという1つの目的に特化させる
- **設定の分離**: 環境設定（`environments.ts`）と負荷パターン（`workloads.ts`）を分けて管理する
- **APIクライアントのカプセル化**: バックエンドとの通信は `lib/clients/` のクラスに閉じ込める
- **タグの活用**: リクエストやテストにタグを付け、結果の分析をしやすくする
- **カスタムメトリクス**: 必要に応じて `k6/metrics` の `Counter` や `Trend` を追加する

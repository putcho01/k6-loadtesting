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
mise を利用したツール・コマンド管理を行います。


## ディレクトリ構成
```
.
├── config/              # 設定ファイル
│   ├── workloads.ts     # 負荷パターン設定（smoke, load, stress等）
│   ├── environments.ts  # 環境別設定（dev, staging, production）
│   └── settings.ts      # 共通設定
├── scenarios/           # 再利用可能なシナリオ
│   ├── e2e/            # エンドツーエンドシナリオ
│   │   └── simple-page-view.ts
│   └── apis/           # APIシナリオ
│       └── user-api.ts
├── tests/              # 実際のテストファイル
│   ├── smoke/          # スモークテスト
│   │   └── demo-smoke-test.ts
│   ├── load/           # 負荷テスト
│   │   └── demo-load-test.ts
│   └── stress/         # ストレステスト
│       └── demo-stress-test.ts
├── lib/                # 再利用可能なモジュール
│   ├── clients/        # APIクライアント
│   │   ├── base-client.ts
│   │   └── api-client.ts
│   └── utils/          # ユーティリティ関数
│       └── helpers.ts
├── data/               # テストデータ（オプション）
├── package.json
├── tsconfig.json
├── mise.toml           # コマンド・ツール管理
└── .gitignore
```

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
ローカルでの動作確認が完了したら、AWS基盤で本格的な負荷試験を実行します
### スクリプトのアップロード
### Traffic Shape（負荷設定）
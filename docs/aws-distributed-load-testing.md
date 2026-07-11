# AWS Distributed Load Testing での実行手順

ローカルでの動作確認が完了したテストスクリプトを、AWS 上で大規模・分散実行するための手順です。
[Distributed Load Testing on AWS](https://aws.amazon.com/solutions/implementations/distributed-load-testing-on-aws/)（以下 DLT）は、AWS Fargate 上でテストを分散実行し、結果を Web コンソールで確認できる AWS Solutions Implementation です。k6 / JMeter / Locust に対応しています。

- ソリューション概要: https://aws.amazon.com/solutions/implementations/distributed-load-testing-on-aws/
- 実装ガイド（詳細な手順・最新のパラメータはここを参照）: https://docs.aws.amazon.com/solutions/latest/distributed-load-testing-on-aws/
- ソースコード: https://github.com/aws-solutions/distributed-load-testing-on-aws

## 1. DLT 環境のデプロイ（初回のみ）

1. [実装ガイドの Deployment 手順](https://docs.aws.amazon.com/solutions/latest/distributed-load-testing-on-aws/deployment.html)に従い、CloudFormation テンプレートを自分の AWS アカウントにデプロイする。
2. デプロイ完了後、CloudFormation スタックの `Outputs` タブから Web コンソールの URL（CloudFront 経由）を控えておく。

この作業はチームで1回行えば良く、以降は誰でもそのコンソールから2章以降の手順でテストを実行できる。

## 2. テストスクリプトを DLT 用に準備する

DLT の k6 テストはスクリプトファイルのアップロードとして `.js` または `.zip` を受け付ける。
このリポジトリのテストは通常ローカルで `.ts` のまま [k6 のネイティブ TypeScript サポート](https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/)で実行するが、DLT に安全にアップロードできるよう、単一の自己完結した JS ファイルにバンドルするビルドスクリプトを用意している。

```bash
mise run build
```

`tests/` 配下の各テストファイルが `dist/` 配下に同じディレクトリ構成でバンドルされる（例: `tests/load/demo-load-test.ts` → `dist/tests/load/demo-load-test.js`）。ローカルの `config/` `lib/` `scenarios/` の import もすべて1ファイルに含まれるため、この `.js` ファイル単体をアップロードすればよい。

> **k6 のバージョン整合性**: DLT のコンテナは実行時に k6 本体を Grafana から取得する。バンドル自体はどのバージョンでも動くプレーンな JS だが、念のためこのリポジトリの `mise.toml` に固定した k6 のバージョンと大きく乖離しないか、DLT 側が使用する k6 バージョンを実装ガイドで確認しておくこと。またこの取得処理のため、DLT が動作する VPC には k6 のダウンロード先への outbound 通信が必要になる（アウトバウンドを制限した VPC では失敗する）。

## 3. コンソールでテストを作成・実行する

1. 手順1で控えた Web コンソールにアクセスする。
2. 「Create test」からテストタイプに **k6** を選択する。
3. 手順2で作成した `dist/tests/<test_type>/<name>.js` をアップロードする。
4. Traffic shape（同時実行数・ランプアップ/ホールド時間・タスク数・実行リージョン）を設定する。

   > **重要**: DLT の Traffic Shape 画面で指定した値は、スクリプト内の `options`（[config/workloads.ts](../config/workloads.ts) で定義した vus/stages 等）より優先される。ローカル実行時の負荷パターンをそのまま使いたい場合は、対応する [config/workloads.ts](../config/workloads.ts) の値（例: `load` なら 20 VUs で 2m ランプアップ→5m 維持→2m ランプダウン）を Traffic Shape 画面に手動で反映すること。
5. 環境変数として `ENVIRONMENT`（`dev` / `staging` / `production`）を設定し、[config/environments.ts](../config/environments.ts) で定義した対象環境に向ける。
6. テストを実行し、コンソール上でレスポンスタイムやエラー率などの結果を確認する。

## 注意事項

- `quickpizza.grafana.com`（このリポジトリのデフォルト対象）は Grafana が公開している小規模な負荷試験向けのデモ環境。DLT での本格的な load/stress/soak テストは、必ず自分たちが管理する環境（`config/environments.ts` に追加した独自の environment、または QuickPizza を自前でデプロイした環境）に対して実行すること。
- 対象システムの管理者から負荷試験の実施許可を得ていることを確認してから実行すること。

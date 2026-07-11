import type { Options } from 'k6/options';
import { getWorkload } from '../../config/workloads.ts';
import { defaultThresholds } from '../../config/settings.ts';
import { simplePageView } from '../../scenarios/e2e/simple-page-view.ts';
import { userApiJourney } from '../../scenarios/apis/user-api.ts';

// load: 想定される平常時トラフィックを一定時間かけ続けるテスト。
export const options: Options = {
  ...getWorkload('load'),
  thresholds: defaultThresholds,
  tags: {
    test_type: 'load',
  },
};

export default function (): void {
  simplePageView();
  userApiJourney();
}

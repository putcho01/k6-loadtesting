import type { Options } from 'k6/options';
import { getWorkload } from '../../config/workloads.ts';
import { defaultThresholds } from '../../config/settings.ts';
import { simplePageView } from '../../scenarios/e2e/simple-page-view.ts';
import { userApiJourney } from '../../scenarios/apis/user-api.ts';

// smoke: 最小構成でシステムが正常に応答するかを疎通確認するテスト。
export const options: Options = {
  ...getWorkload('smoke'),
  thresholds: defaultThresholds,
  tags: {
    test_type: 'smoke',
  },
};

export default function (): void {
  simplePageView();
  userApiJourney();
}

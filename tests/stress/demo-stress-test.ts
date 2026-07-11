import type { Options } from 'k6/options';
import { getWorkload } from '../../config/workloads.ts';
import { defaultThresholds } from '../../config/settings.ts';
import { simplePageView } from '../../scenarios/e2e/simple-page-view.ts';
import { userApiJourney } from '../../scenarios/apis/user-api.ts';

// stress: 負荷を段階的に上げ、システムの限界点を探るテスト。
export const options: Options = {
  ...getWorkload('stress'),
  thresholds: defaultThresholds,
  tags: {
    test_type: 'stress',
  },
};

export default function (): void {
  simplePageView();
  userApiJourney();
}

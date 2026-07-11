import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironment } from '../../config/environments.ts';
import { THINK_TIME_SECONDS } from '../../config/settings.ts';

// トップページと軽量なデータ読み込みを閲覧する、単純なページビューシナリオ。
// 複数のテスト（smoke/load/stress）から共有して使う。
export function simplePageView(): void {
  const { baseUrl } = getEnvironment();

  group('view homepage', () => {
    const res = http.get(baseUrl, { tags: { scenario: 'simple_page_view' } });
    check(res, {
      'homepage status is 200': (r) => r.status === 200,
    });
  });

  sleep(THINK_TIME_SECONDS);

  group('load quotes', () => {
    const res = http.get(`${baseUrl}/api/quotes`, { tags: { scenario: 'simple_page_view' } });
    check(res, {
      'quotes status is 200': (r) => r.status === 200,
    });
  });

  sleep(THINK_TIME_SECONDS);
}

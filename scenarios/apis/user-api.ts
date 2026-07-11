import { check, group, sleep } from 'k6';
import { getEnvironment } from '../../config/environments.ts';
import { THINK_TIME_SECONDS } from '../../config/settings.ts';
import { QuickPizzaApiClient, type Rating } from '../../lib/clients/api-client.ts';
import { parseJson, randomString } from '../../lib/utils/helpers.ts';

interface LoginResponseBody {
  token: string;
}

interface PizzaResponseBody {
  pizza: { id: number };
}

// ユーザー登録 → ログイン → ピザ取得 → 評価の CRUD、という一連の API 利用シナリオ。
// 複数のテスト（smoke/load/stress）から共有して使う。
export function userApiJourney(): void {
  const { baseUrl } = getEnvironment();
  const client = new QuickPizzaApiClient(baseUrl);

  const credentials = {
    username: `k6-user-${randomString(8)}`,
    password: randomString(16),
  };

  group('register user', () => {
    const registerRes = client.registerUser(credentials);
    check(registerRes, {
      'register status is 201': (r) => r.status === 201,
    });
  });

  let token = '';
  group('login', () => {
    const loginRes = client.login(credentials);
    check(loginRes, {
      'login status is 200': (r) => r.status === 200,
    });
    token = parseJson<LoginResponseBody>(loginRes.body).token;
  });

  sleep(THINK_TIME_SECONDS);

  group('rate a pizza', () => {
    const pizzaRes = client.getPizzaRecommendation(token, { maxNumberOfToppings: 5 });
    check(pizzaRes, {
      'pizza recommendation status is 200': (r) => r.status === 200,
    });
    const pizzaId = parseJson<PizzaResponseBody>(pizzaRes.body).pizza.id;

    const rating: Rating = { stars: 5, pizza_id: pizzaId };
    const createRes = client.createRating(token, rating);
    check(createRes, {
      'create rating status is 201': (r) => r.status === 201,
    });
    const createdId = parseJson<Rating & { id: number }>(createRes.body).id;

    const updateRes = client.updateRating(token, createdId, { stars: 4, pizza_id: pizzaId });
    check(updateRes, {
      'update rating status is 200': (r) => r.status === 200,
    });

    const listRes = client.getRatings(token);
    check(listRes, {
      'list ratings status is 200': (r) => r.status === 200,
    });

    const deleteRes = client.deleteRating(token, createdId);
    check(deleteRes, {
      'delete rating status is 204': (r) => r.status === 204,
    });
  });

  sleep(THINK_TIME_SECONDS);
}

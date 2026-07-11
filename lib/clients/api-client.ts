import { BaseClient, type RequestOptions } from './base-client.ts';

// https://github.com/grafana/quickpizza の公開 API に対するクライアント。
// QuickPizza は Grafana が公開している負荷試験デモ用アプリで、
// quickpizza.grafana.com は小規模な負荷試験を行うための環境として案内されている。
export interface Credentials {
  username: string;
  password: string;
}

export interface PizzaRestrictions {
  maxCaloriesPerSlice?: number;
  mustBeVegetarian?: boolean;
  excludedIngredients?: string[];
  excludedTools?: string[];
  maxNumberOfToppings?: number;
  minNumberOfToppings?: number;
}

export interface Rating {
  id?: number;
  stars: number;
  pizza_id: number;
}

export class QuickPizzaApiClient extends BaseClient {
  registerUser(credentials: Credentials) {
    return this.post('/api/users', credentials);
  }

  login(credentials: Credentials) {
    return this.post('/api/users/token/login', credentials);
  }

  getPizzaRecommendation(token: string, restrictions: PizzaRestrictions = {}) {
    return this.post('/api/pizza', restrictions, this.withAuth(token));
  }

  createRating(token: string, rating: Rating) {
    return this.post('/api/ratings', rating, this.withAuth(token));
  }

  getRatings(token: string) {
    return this.get('/api/ratings', this.withAuth(token));
  }

  updateRating(token: string, id: number, rating: Rating) {
    return this.put(`/api/ratings/${id}`, rating, this.withAuth(token));
  }

  deleteRating(token: string, id: number) {
    return this.delete(`/api/ratings/${id}`, this.withAuth(token));
  }

  getQuotes() {
    return this.get('/api/quotes');
  }

  private withAuth(token: string): RequestOptions {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}

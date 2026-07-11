import http, { type RefinedResponse } from 'k6/http';
import { defaultHeaders } from '../../config/settings.ts';

export interface RequestOptions {
  headers?: Record<string, string>;
  tags?: Record<string, string>;
}

// バックエンドとの通信をカプセル化する基底クライアント。
// 個々の API クライアントはこれを継承し、エンドポイント固有のメソッドのみを追加する。
export class BaseClient {
  constructor(protected readonly baseUrl: string) {}

  protected url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  protected params(options: RequestOptions = {}) {
    return {
      headers: { ...defaultHeaders, ...options.headers },
      tags: options.tags,
    };
  }

  get(path: string, options?: RequestOptions): RefinedResponse<'text'> {
    return http.get(this.url(path), this.params(options));
  }

  post(path: string, body?: unknown, options?: RequestOptions): RefinedResponse<'text'> {
    return http.post(this.url(path), JSON.stringify(body ?? {}), this.params(options));
  }

  put(path: string, body?: unknown, options?: RequestOptions): RefinedResponse<'text'> {
    return http.put(this.url(path), JSON.stringify(body ?? {}), this.params(options));
  }

  patch(path: string, body?: unknown, options?: RequestOptions): RefinedResponse<'text'> {
    return http.patch(this.url(path), JSON.stringify(body ?? {}), this.params(options));
  }

  delete(path: string, options?: RequestOptions): RefinedResponse<'text'> {
    return http.del(this.url(path), null, this.params(options));
  }
}

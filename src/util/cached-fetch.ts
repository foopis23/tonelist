import { Store } from "@foopis23/ts-store";

export type CachedFetchClientOptions = {
	baseURL?: string;
	cache: Store<unknown>;
	cacheTTL: number;
}

export type FetchOptions = {
	cache?: {
		cache?: boolean;
		cacheKey?: string | ((url: string, requestOptions: RequestInit) => string);
	};
	request?: RequestInit;
}

export class FetchError extends Error {
	constructor(public requests: { url: string, options: RequestInit }, public response: Response, public body: unknown) {
		super(`Failed to fetch ${requests.url}: ${response.status} ${response.statusText}`);
	}
}

function defaultCacheKey(url: string, requestOptions: RequestInit) {
	return `${url}${JSON.stringify(requestOptions)}`;
}

export class CachedFetchClient {
	constructor(private options: CachedFetchClientOptions) { }

	async fetch<T>(url: string, { request, cache: { cache = true, cacheKey = defaultCacheKey } = {} }: FetchOptions = {}): Promise<T> {
		if (cache) {
			const key = typeof cacheKey === 'function' ? cacheKey(url, request) : cacheKey;
			const cached = await this.options.cache.get(key);

			if (cached && cached.updatedAt + this.options.cacheTTL < Date.now()) {
				this.options.cache.destroy(key);
			} else if (cached) {
				return cached.value as T;
			}
		}

		const response = await fetch(url, request);
		if (!response.ok) {
			throw new FetchError({ url, options: request }, response, await response.text());
		}

		const json = await response.json() as T;

		if (cache) {
			const key = typeof cacheKey === 'function' ? cacheKey(url, request) : cacheKey;
			this.options.cache.set(key, json);
		}

		return json;
	}

	async clearCache() {
		await this.options.cache.clear();
	}

	async clearKey(key: string) {
		await this.options.cache.destroy(key);
	}
}
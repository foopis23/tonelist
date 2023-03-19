import { Store, StoreError, StoreErrorType } from "./types";

class InMemoryStore<T> implements Store<T> {
	private state: Map<string, T> = new Map();

	get(key: string): T {
		if (!this.state.has(key)) {
			throw new StoreError(`Key ${key} not found`, StoreErrorType.NOT_FOUND)
		}

		return this.state.get(key);
	}

	set(key: string, value: T): T {
		this.state.set(key, value);
		return value;
	}

	delete(key: string): void {
		if (!this.state.has(key)) {
			throw new StoreError(`Key ${key} not found`, StoreErrorType.NOT_FOUND)
		}

		this.state.delete(key);
	}
}

export default InMemoryStore;
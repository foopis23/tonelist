export interface Store<T> {
	get(key: string): T | Promise<T>
	set(key: string, value: T): T | Promise<T>
	delete(key: string): void
}

export enum StoreErrorType {
	NOT_FOUND = 'Item not found'
}

const errorTypeMap: Record<StoreErrorType, number> = {
	[StoreErrorType.NOT_FOUND]: -32005
};

export class StoreError extends Error {
	constructor(message: string, public type: StoreErrorType) {
		super(message);
	}

	toRpcError() {
		return {
			code: errorTypeMap[this.type],
			message: this.message
		};
	}
}

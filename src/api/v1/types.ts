export interface RPCError {
	toRpcError(): {
		code: number;
		message: string;
	};
}

// justification: this is a type guard, those we expect the user to pass in anything into it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isRpcError = (error: any): error is RPCError =>
	typeof error?.toRpcError === 'function';

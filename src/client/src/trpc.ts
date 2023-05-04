import { AppRouter } from './../../http/trpc/router';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export const client = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:3000/api/trpc'
		})
	]
})

import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

export async function getPaddleInstance(): Promise<Paddle> {
  if (typeof window === 'undefined') {
    throw new Error('getPaddleInstance must be called on the client side');
  }

  if (paddleInstance) return paddleInstance;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || process.env.NEXT_PUBLIC_PADDLE_ENV;

  if (!token) {
    throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing. Add your Paddle client-side token to .env');
  }
  if (!env) {
    throw new Error('NEXT_PUBLIC_PADDLE_ENVIRONMENT is missing. Set it to "live" or "sandbox".');
  }

  const environment: 'sandbox' | 'production' = env === 'sandbox' ? 'sandbox' : 'production';

  paddleInstance = await initializePaddle({
    token,
    environment,
    eventCallback: (data: any) => {
      console.log('Paddle event:', data);
    },
  });

  if (!paddleInstance) {
    throw new Error('Paddle failed to initialize. Check your token and environment.');
  }

  return paddleInstance;
}
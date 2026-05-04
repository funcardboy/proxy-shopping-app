const API_KEY = process.env.NEXT_PUBLIC_APP_API_KEY || '';

export const secureFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (API_KEY) {
    headers.set('x-api-key', API_KEY);
  }
  
  return fetch(input, {
    ...init,
    headers,
  });
};

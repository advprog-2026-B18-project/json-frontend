import { ordersFetch } from './client';

// Generic Orders API client.
// Add domain-specific functions here as endpoints get defined.
export const ordersApi = {
  fetch: ordersFetch,
};

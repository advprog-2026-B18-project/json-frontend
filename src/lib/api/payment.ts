import { paymentFetch } from './client';

// Generic Payment API client.
// Add domain-specific functions here as endpoints get defined.
export const paymentApi = {
  fetch: paymentFetch,
};

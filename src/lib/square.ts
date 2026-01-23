import { SquareClient, SquareEnvironment } from 'square';

if (!process.env.SQUARE_SELLER_ACCESS_TOKEN) {
  throw new Error('SQUARE_SELLER_ACCESS_TOKEN environment variable is not set');
}

if (!process.env.SQUARE_LOCATION_ID) {
  throw new Error('SQUARE_LOCATION_ID environment variable is not set');
}

const client = new SquareClient({
  token: process.env.SQUARE_SELLER_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENV === 'sandbox'
    ? SquareEnvironment.Sandbox
    : SquareEnvironment.Production
});

export const catalogApi = client.catalog;
export const ordersApi = client.orders;
export const paymentsApi = client.payments;
export const locationsApi = client.locations;
export const locationId = process.env.SQUARE_LOCATION_ID;

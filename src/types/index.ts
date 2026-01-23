// Menu types
export interface MenuVariation {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  variations: MenuVariation[];
}

export interface MenuResponse {
  items: MenuItem[];
}

// Cart types
export interface CartItem {
  variationId: string;
  itemId: string;
  name: string;
  variationName: string;
  priceCents: number;
  currency: string;
  quantity: number;
}

// Order types
export interface CreateOrderRequest {
  items: { variationId: string; quantity: number }[];
  fulfillment: {
    displayName: string;
    phoneNumber: string;
    pickupAt: string;
  };
}

export interface CreateOrderResponse {
  orderId: string;
  orderVersion: number;
  totalAmountCents: number;
  currency: string;
}

export interface PayOrderRequest {
  orderId: string;
  sourceId: string;
  amountCents: number;
  currency: string;
}

export interface PayOrderResponse {
  paymentId: string;
  status: string;
  orderId: string;
}

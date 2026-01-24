import type { DoorDashConfig } from '../config/doorDashConfig';
export interface QuotePayload {
    external_delivery_id: string;
    pickup_address: string;
    pickup_business_name: string;
    pickup_phone_number: string;
    pickup_instructions?: string;
    dropoff_address: string;
    dropoff_business_name: string;
    dropoff_phone_number: string;
    dropoff_instructions?: string;
    order_value: number;
}
export interface QuoteResponse {
    external_delivery_id: string;
    delivery_status: string;
    fee: number;
    pickup_time_estimated: string;
    dropoff_time_estimated: string;
    currency: string;
    pickup_address: string;
    dropoff_address: string;
    [key: string]: any;
}
export interface AcceptQuotePayload {
    tip?: number;
}
export interface DeliveryResponse {
    external_delivery_id: string;
    delivery_status?: string;
    fee?: number;
    tracking_url?: string;
    pickup_address?: string;
    dropoff_address?: string;
    created_at?: string;
    [key: string]: any;
}
export declare class DoorDashClient {
    private config;
    private axios;
    constructor(config: DoorDashConfig);
    /**
     * Build a JWT token for DoorDash Drive API
     * Token is valid for 5 minutes
     */
    private buildJWT;
    /**
     * Get a delivery quote from DoorDash Drive API
     * This checks if the delivery is serviceable and returns estimated fees and times
     */
    getQuote(payload: QuotePayload): Promise<QuoteResponse>;
    /**
     * Accept a delivery quote to create the actual delivery
     * Must be called within 5 minutes of getting the quote
     */
    acceptQuote(externalDeliveryId: string, payload?: AcceptQuotePayload): Promise<DeliveryResponse>;
    /**
     * Get delivery status from DoorDash Drive API
     */
    getDelivery(externalDeliveryId: string): Promise<DeliveryResponse>;
}
//# sourceMappingURL=DoorDashClient.d.ts.map
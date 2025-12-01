import jwt from 'jsonwebtoken';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
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
  order_value: number; // in cents
}

export interface QuoteResponse {
  external_delivery_id: string;
  delivery_status: string; // "quote"
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

export class DoorDashClient {
  private config: DoorDashConfig;
  private axios: AxiosInstance;

  constructor(config: DoorDashConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Build a JWT token for DoorDash Drive API
   * Token is valid for 5 minutes
   */
  private buildJWT(): string {
    const payload = {
      aud: 'doordash',
      iss: this.config.developerId,
      kid: this.config.keyId,
      exp: Math.floor(Date.now() / 1000 + 300), // 5 minutes
      iat: Math.floor(Date.now() / 1000),
    };

    // Signing secret must be base64-decoded
    const signingKey = Buffer.from(this.config.signingSecret, 'base64');

    return jwt.sign(payload, signingKey, {
      algorithm: 'HS256',
      header: { 'dd-ver': 'DD-JWT-V1' },
    } as any);
  }

  /**
   * Get a delivery quote from DoorDash Drive API
   * This checks if the delivery is serviceable and returns estimated fees and times
   */
  async getQuote(payload: QuotePayload): Promise<QuoteResponse> {
    try {
      const token = this.buildJWT();
      const response = await this.axios.post('/drive/v2/quotes', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error getting delivery quote:', error.message);
      if (error.response) {
        console.error('DoorDash API Error:', JSON.stringify(error.response.data, null, 2));
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Accept a delivery quote to create the actual delivery
   * Must be called within 5 minutes of getting the quote
   */
  async acceptQuote(externalDeliveryId: string, payload?: AcceptQuotePayload): Promise<DeliveryResponse> {
    try {
      const token = this.buildJWT();
      const response = await this.axios.post(
        `/drive/v2/quotes/${externalDeliveryId}/accept`,
        payload || {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error accepting quote ${externalDeliveryId}:`, error.message);
      if (error.response) {
        console.error('DoorDash API Error:', JSON.stringify(error.response.data, null, 2));
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Get delivery status from DoorDash Drive API
   */
  async getDelivery(externalDeliveryId: string): Promise<DeliveryResponse> {
    try {
      const token = this.buildJWT();
      const response = await this.axios.get(
        `/drive/v2/deliveries/${externalDeliveryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching delivery ${externalDeliveryId}:`, error);
      throw error;
    }
  }

}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoorDashClient = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
class DoorDashClient {
    constructor(config) {
        this.config = config;
        this.axios = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: 10000,
        });
    }
    /**
     * Build a JWT token for DoorDash Drive API
     * Token is valid for 5 minutes
     */
    buildJWT() {
        const payload = {
            aud: 'doordash',
            iss: this.config.developerId,
            kid: this.config.keyId,
            exp: Math.floor(Date.now() / 1000 + 300), // 5 minutes
            iat: Math.floor(Date.now() / 1000),
        };
        // Signing secret must be base64-decoded
        const signingKey = Buffer.from(this.config.signingSecret, 'base64');
        return jsonwebtoken_1.default.sign(payload, signingKey, {
            algorithm: 'HS256',
            header: { 'dd-ver': 'DD-JWT-V1' },
        });
    }
    /**
     * Get a delivery quote from DoorDash Drive API
     * This checks if the delivery is serviceable and returns estimated fees and times
     */
    async getQuote(payload) {
        try {
            const token = this.buildJWT();
            const response = await this.axios.post('/drive/v2/quotes', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
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
    async acceptQuote(externalDeliveryId, payload) {
        try {
            const token = this.buildJWT();
            const response = await this.axios.post(`/drive/v2/quotes/${externalDeliveryId}/accept`, payload || {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
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
    async getDelivery(externalDeliveryId) {
        try {
            const token = this.buildJWT();
            const response = await this.axios.get(`/drive/v2/deliveries/${externalDeliveryId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching delivery ${externalDeliveryId}:`, error);
            throw error;
        }
    }
}
exports.DoorDashClient = DoorDashClient;
//# sourceMappingURL=DoorDashClient.js.map
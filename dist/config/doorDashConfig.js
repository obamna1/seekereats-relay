"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoorDashConfig = void 0;
const getDoorDashConfig = () => {
    const config = {
        developerId: process.env.DOORDASH_DEVELOPER_ID || '',
        keyId: process.env.DOORDASH_KEY_ID || '',
        signingSecret: process.env.DOORDASH_SIGNING_SECRET || '',
        baseUrl: process.env.DOORDASH_BASE_URL || 'https://openapi.doordash.com',
        relaySecret: process.env.RELAY_SECRET || '',
        port: parseInt(process.env.PORT || '3000', 10),
    };
    // Validate required env vars
    const required = ['developerId', 'keyId', 'signingSecret', 'relaySecret'];
    const missing = required.filter(key => !config[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    return config;
};
exports.getDoorDashConfig = getDoorDashConfig;
exports.default = (0, exports.getDoorDashConfig)();
//# sourceMappingURL=doorDashConfig.js.map
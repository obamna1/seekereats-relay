export interface DoorDashConfig {
  developerId: string;
  keyId: string;
  signingSecret: string;
  baseUrl: string;
  relaySecret: string;
  port: number;
}

export const getDoorDashConfig = (): DoorDashConfig => {
  const config: DoorDashConfig = {
    developerId: process.env.DOORDASH_DEVELOPER_ID || '',
    keyId: process.env.DOORDASH_KEY_ID || '',
    signingSecret: process.env.DOORDASH_SIGNING_SECRET || '',
    baseUrl: process.env.DOORDASH_BASE_URL || 'https://openapi.doordash.com',
    relaySecret: process.env.RELAY_SECRET || '',
    port: parseInt(process.env.PORT || '3000', 10),
  };

  // Validate required env vars
  const required = ['developerId', 'keyId', 'signingSecret', 'relaySecret'];
  const missing = required.filter(key => !config[key as keyof DoorDashConfig]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
};

export default getDoorDashConfig();

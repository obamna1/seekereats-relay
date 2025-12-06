export default {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  testPhoneNumber: process.env.TEST_PHONE_NUMBER,
  baseUrl: process.env.BASE_URL,
  enablePhoneCalls: process.env.ENABLE_PHONE_CALLS === 'true',
};

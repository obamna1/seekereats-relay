import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import config from '../config/twilioConfig';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// In-memory store to track call responses (shared with relay.ts)
export const callStore: { [key: string]: any } = {};

/**
 * POST /twilio/twiml
 * Generate TwiML for the order call with accept/reject/repeat functionality
 */
router.post('/twiml', (req: Request, res: Response) => {
  const message = req.query.message as string;
  const delivery_id = req.query.delivery_id as string;
  const call_sid = req.query.CallSid as string;
  const twiml = new VoiceResponse();

  if (!message) {
    twiml.say('An error occurred. No message provided.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const baseUrl = config.baseUrl || '';
  const actionUrl = `${baseUrl}/twilio/order-response?message=${encodeURIComponent(message)}&delivery_id=${delivery_id}&call_sid=${call_sid}`;

  // Create a Gather verb to listen for input
  const gather = twiml.gather({
    numDigits: 1,
    action: actionUrl,
    method: 'POST',
    timeout: 15
  });

  gather.say(message);
  gather.pause({ length: 1 });
  gather.say('Press 1 to accept this order, press 2 to reject this order, or press 3 to repeat this message.');

  // If no input, say goodbye
  twiml.say('No response received. Goodbye.');

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * POST /twilio/order-response
 * Handle restaurant's response (accept/reject/repeat)
 */
router.post('/order-response', (req: Request, res: Response) => {
  const message = req.query.message as string;
  const delivery_id = req.query.delivery_id as string;
  const call_sid = req.query.call_sid as string;
  const digit = req.body.Digits;
  const twiml = new VoiceResponse();

  if (digit === '1') {
    // Accept order
    if (call_sid && callStore[call_sid]) {
      callStore[call_sid].status = 'accepted';
      callStore[call_sid].response_time = new Date().toISOString();
    }
    twiml.say('Thank you! The order has been accepted. A driver will pick up the order shortly.');
  } else if (digit === '2') {
    // Reject order
    if (call_sid && callStore[call_sid]) {
      callStore[call_sid].status = 'rejected';
      callStore[call_sid].response_time = new Date().toISOString();
    }
    twiml.say('The order has been rejected. The customer will be notified.');
  } else if (digit === '3') {
    // Repeat message - redirect back to twiml
    const baseUrl = config.baseUrl || '';
    twiml.redirect(`${baseUrl}/twilio/twiml?message=${encodeURIComponent(message)}&delivery_id=${delivery_id}&call_sid=${call_sid}`);
  } else {
    // Invalid input
    twiml.say('Invalid selection. Goodbye.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;

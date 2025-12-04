import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import config from '../config/twilioConfig';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * POST /twilio/twiml
 * Generate TwiML for the order call with repeat functionality
 */
router.post('/twiml', (req: Request, res: Response) => {
  const message = req.query.message as string;
  const twiml = new VoiceResponse();

  if (!message) {
    twiml.say('An error occurred. No message provided.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  // Construct the action URL for the Gather verb
  // We need to ensure we have the full URL including the message query param
  // If config.baseUrl is not set, this might fail or be relative (which Twilio doesn't like for callbacks usually, 
  // but if it's relative to the current call's domain it might work? 
  // Safest is absolute URL).
  const baseUrl = config.baseUrl || ''; 
  const actionUrl = `${baseUrl}/twilio/twiml?message=${encodeURIComponent(message)}`;

  // Create a Gather verb to listen for input
  const gather = twiml.gather({
    numDigits: 1,
    action: actionUrl,
    method: 'POST',
    timeout: 10 
  });

  gather.say(message);
  gather.pause({ length: 1 });
  gather.say('Press 1 to repeat this message.');

  // If the user doesn't enter input, loop once or say goodbye?
  // User asked for "press button to repeat". 
  // If they don't press, we can just hang up or say goodbye.
  twiml.say('Goodbye.');

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;

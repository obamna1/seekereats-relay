"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callStore = void 0;
const express_1 = require("express");
const twilio_1 = __importDefault(require("twilio"));
const twilioConfig_1 = __importDefault(require("../config/twilioConfig"));
const router = (0, express_1.Router)();
const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
// In-memory store to track call responses (shared with relay.ts)
exports.callStore = {};
/**
 * POST /twilio/twiml
 * Generate TwiML for the order call with accept/reject/repeat functionality
 */
router.post('/twiml', (req, res) => {
    const message = req.query.message;
    const delivery_id = req.query.delivery_id;
    const call_sid = req.query.CallSid;
    const twiml = new VoiceResponse();
    if (!message) {
        twiml.say('An error occurred. No message provided.');
        res.type('text/xml');
        res.send(twiml.toString());
        return;
    }
    const baseUrl = twilioConfig_1.default.baseUrl || '';
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
router.post('/order-response', (req, res) => {
    const message = req.query.message;
    const delivery_id = req.query.delivery_id;
    const call_sid = req.query.call_sid;
    const digit = req.body.Digits;
    const twiml = new VoiceResponse();
    if (digit === '1') {
        // Accept order
        if (call_sid && exports.callStore[call_sid]) {
            exports.callStore[call_sid].status = 'accepted';
            exports.callStore[call_sid].response_time = new Date().toISOString();
        }
        twiml.say('Thank you! The order has been accepted. A driver will pick up the order shortly.');
    }
    else if (digit === '2') {
        // Reject order
        if (call_sid && exports.callStore[call_sid]) {
            exports.callStore[call_sid].status = 'rejected';
            exports.callStore[call_sid].response_time = new Date().toISOString();
        }
        twiml.say('The order has been rejected. The customer will be notified.');
    }
    else if (digit === '3') {
        // Repeat message - redirect back to twiml
        const baseUrl = twilioConfig_1.default.baseUrl || '';
        twiml.redirect(`${baseUrl}/twilio/twiml?message=${encodeURIComponent(message)}&delivery_id=${delivery_id}&call_sid=${call_sid}`);
    }
    else {
        // Invalid input
        twiml.say('Invalid selection. Goodbye.');
    }
    res.type('text/xml');
    res.send(twiml.toString());
});
exports.default = router;
//# sourceMappingURL=twilio.js.map
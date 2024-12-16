const twilio = require('twilio');
const hederaService = require('./hederaService');

const VoiceResponse = twilio.twiml.VoiceResponse;

class TwilioService {
    handleIncomingCall(req, res) {
        const twiml = new VoiceResponse();
        
        twiml.gather({
            numDigits: 10,
            action: '/process-call'
        }).say('Please enter the phone number you wish to call');

        res.type('text/xml');
        res.send(twiml.toString());
    }

    async processCall(req, res) {
        const callerNumber = req.body.From;
        const calledNumber = req.body.Digits;
        
        // Log to Hedera
        const callData = {
            caller: callerNumber,
            called: calledNumber,
            timestamp: new Date().toISOString(),
            callId: req.body.CallSid
        };

        try {
            await hederaService.logCall(callData);
            
            // Send SMS confirmation
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            await client.messages.create({
                body: `Call logged. From: ${callerNumber} To: ${calledNumber}`,
                to: callerNumber,
                from: process.env.TWILIO_PHONE_NUMBER
            });

            // Connect the call
            const twiml = new VoiceResponse();
            twiml.dial(calledNumber);
            
            res.type('text/xml');
            res.send(twiml.toString());
        } catch (error) {
            console.error('Error processing call:', error);
            const twiml = new VoiceResponse();
            twiml.say('An error occurred. Please try again later.');
            res.type('text/xml');
            res.send(twiml.toString());
        }
    }
}

module.exports = new TwilioService();

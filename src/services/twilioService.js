const twilio = require('twilio');
const hederaService = require('./hederaService');

const VoiceResponse = twilio.twiml.VoiceResponse;

// Whitelist of allowed numbers
const ALLOWED_NUMBERS = {
    '1': '1234567890', // Example: Amazon Customer Service
    '2': '00000000000', // Example: Test Number 2
    '3': '5555555555', // Example: Test Number 3
};

class TwilioService {
    handleIncomingCall(req, res) {
        const twiml = new VoiceResponse();
        
        // Provide menu of options
        twiml.say('Welcome to the call logger. Please select from the following options:');
        twiml.say('Press 1 for Amazon Customer Service');
        twiml.say('Press 2 for Test Number 2');
        twiml.say('Press 3 for Test Number 3');
        
        twiml.gather({
            numDigits: 1,
            action: '/process-call'
        });

        res.type('text/xml');
        res.send(twiml.toString());
    }

    async processCall(req, res) {
        const callerNumber = req.body.From;
        const selection = req.body.Digits;
        const calledNumber = ALLOWED_NUMBERS[selection];

        if (!calledNumber) {
            const twiml = new VoiceResponse();
            twiml.say('Invalid selection. Goodbye.');
            res.type('text/xml');
            return res.send(twiml.toString());
        }

        // Log to Hedera
        const callData = {
            caller: callerNumber,
            called: calledNumber,
            timestamp: new Date().toISOString(),
            callId: req.body.CallSid
        };

        try {
            const hederaResponse = await hederaService.logCall(callData);
            
            // Provide verbal verification code
            const verificationCode = hederaResponse.hashedData.callId.substring(0, 6);
            
            const twiml = new VoiceResponse();
            twiml.say(`Your verification code is ${verificationCode.split('').join(' ')}`);
            twiml.say('Please write this down. You can verify your call at our website using this code.');
            twiml.pause({ length: 2 });
            
            // Connect the call
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

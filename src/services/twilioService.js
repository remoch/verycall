const twilio = require('twilio');
const hederaService = require('./hederaService');
const { hashData } = require('../utils/hash');
const VoiceResponse = twilio.twiml.VoiceResponse;

class TwilioService {
    constructor() {
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }

    async handleIncomingCall(req, res) {
        const callSid = req.body.CallSid;
        const callerNumber = req.body.From;
        const twiml = new VoiceResponse();
        
        // Generate reference code
        const referenceCode = hashData(callSid).substring(0, 6);

        // Send SMS with verification details
        try {
            await this.twilioClient.messages.create({
                body: `Your secure verification code is: ${referenceCode}. 
                      You can verify your call at: ${process.env.BASE_URL}/verify`,
                to: callerNumber,
                from: process.env.TWILIO_PHONE_NUMBER
            });
            console.log('SMS sent successfully to:', callerNumber);
        } catch (error) {
            console.error('Error sending SMS:', error);
        }

        // Log call with verification code
        await hederaService.logCall({
            type: 'CALL_START',
            callId: callSid,
            caller: callerNumber,
            timestamp: new Date().toISOString(),
            verificationCode: referenceCode
        });

        // Welcome message
        twiml.say({
            voice: 'Polly.Amy'
        }, 'Welcome to VeryCall, a secure call logging service.');

        twiml.pause({ length: 2 });

        // First mention of code
        twiml.say({
            voice: 'Polly.Amy'
        }, 'Your secure verification code is:');

        twiml.pause({ length: 1 });

        // Say code slowly, digit by digit
        twiml.say({
            voice: 'Polly.Amy'
        }, referenceCode.split('').join('... '));

        twiml.pause({ length: 2 });

        // Repeat code
        twiml.say({
            voice: 'Polly.Amy'
        }, 'I will repeat that. Your code is:');

        twiml.pause({ length: 1 });

        twiml.say({
            voice: 'Polly.Amy'
        }, referenceCode.split('').join('... '));

        twiml.pause({ length: 2 });

        // Explanation
        twiml.say({
            voice: 'Polly.Amy'
        }, 'This code has been sent to your phone via SMS. You can use it to verify your call record at any time.');

        twiml.pause({ length: 1 });

        twiml.say({
            voice: 'Polly.Amy'
        }, 'Thank you for participating in this demonstration of secure call logging. You may hang up now.');

        res.type('text/xml');
        res.send(twiml.toString());
    }
}

module.exports = new TwilioService();

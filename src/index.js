require('dotenv').config();
const express = require('express');
const twilioService = require('./services/twilioService');
const path = require('path');
const hederaService = require('./services/hederaService');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug static file serving
console.log('Static directory:', path.join(__dirname, '../public'));
app.use('/', express.static(path.join(__dirname, '../public')));

// Debug route to check if server is running
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Twilio webhook endpoints
app.post('/voice', (req, res) => {
    console.log('Received voice webhook:', req.body);
    twilioService.handleIncomingCall(req, res);
});

// Explicit route for verify.html
app.get('/verify', (req, res) => {
    const verifyPath = path.join(__dirname, '../public/verify.html');
    console.log('Trying to serve:', verifyPath);
    // Check if file exists
    if (require('fs').existsSync(verifyPath)) {
        console.log('File exists, serving...');
        res.sendFile(verifyPath);
    } else {
        console.log('File not found!');
        res.status(404).send('Verify page not found');
    }
});

// API endpoint for verification
app.post('/api/verify', async (req, res) => {
    try {
        const { code, phoneNumber } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        // Format phone number to match Twilio's E.164 format
        let formattedPhone = phoneNumber;
        if (phoneNumber && !phoneNumber.startsWith('+')) {
            formattedPhone = '+' + phoneNumber;
        }

        console.log('Verifying:', { code, phoneNumber: formattedPhone });

        const messages = await hederaService.getMessagesForCode(code, formattedPhone);
        
        if (messages.length === 0) {
            return res.status(404).json({ 
                error: formattedPhone 
                    ? 'No matching call found for this code and phone number' 
                    : 'No record found for this code' 
            });
        }

        // Return the most recent matching call
        const verifiedCall = messages[messages.length - 1];
        
        res.json({
            verified: true,
            callDetails: {
                timestamp: verifiedCall.timestamp,
                consensusTimestamp: verifiedCall.consensusTimestamp,
                sequenceNumber: verifiedCall.sequenceNumber,
                phoneNumberMatch: !!formattedPhone, // Indicate if phone number was verified
                proofUrl: `https://hashscan.io/testnet/topic/${process.env.HEDERA_TOPIC_ID}/message/${verifiedCall.sequenceNumber}`
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});

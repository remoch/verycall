require('dotenv').config();
const express = require('express');
const twilioService = require('./services/twilioService');

const app = express();
app.use(express.urlencoded({ extended: true }));

// Twilio webhook endpoints
app.post('/voice', twilioService.handleIncomingCall);
app.post('/process-call', twilioService.processCall);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const twilioService = require('./services/twilioService');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug route to check if server is running
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Twilio webhook endpoints
app.post('/voice', (req, res) => {
    console.log('Received voice webhook:', req.body);
    twilioService.handleIncomingCall(req, res);
});

app.post('/process-call', (req, res) => {
    console.log('Processing call:', req.body);
    twilioService.processCall(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

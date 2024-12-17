const { Client, TopicMessageSubmitTransaction } = require("@hashgraph/sdk");
const { hashData } = require('../utils/hash');

class HederaService {
    constructor() {
        // Initialize Hedera client
        const accountId = process.env.HEDERA_ACCOUNT_ID;
        const privateKey = process.env.HEDERA_PRIVATE_KEY;
        
        this.client = Client.forTestnet();
        this.client.setOperator(accountId, privateKey);
        this.topicId = process.env.HEDERA_TOPIC_ID;
    }

    async logCall(callData) {
        try {
            console.log('Original data:', callData); // Debug log

            // Hash sensitive information
            const hashedData = {
                callerHash: hashData(callData.caller),
                calledHash: hashData(callData.called),
                timestamp: callData.timestamp,
                callId: hashData(callData.callId)
            };

            console.log('Hashed data:', hashedData); // Debug log

            const message = new TopicMessageSubmitTransaction()
                .setTopicId(this.topicId)
                .setMessage(JSON.stringify(hashedData));

            const response = await message.execute(this.client);
            const receipt = await response.getReceipt(this.client);
            
            return {
                status: receipt.status.toString(),
                hashedData
            };
        } catch (error) {
            console.error('Error logging to Hedera:', error);
            throw error;
        }
    }
}

module.exports = new HederaService();

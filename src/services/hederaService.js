const { Client, TopicMessageSubmitTransaction } = require("@hashgraph/sdk");

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
            const message = new TopicMessageSubmitTransaction()
                .setTopicId(this.topicId)
                .setMessage(JSON.stringify(callData));

            const response = await message.execute(this.client);
            const receipt = await response.getReceipt(this.client);
            
            return receipt.status.toString();
        } catch (error) {
            console.error('Error logging to Hedera:', error);
            throw error;
        }
    }
}

module.exports = new HederaService();

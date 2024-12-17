const { Client, TopicMessageSubmitTransaction } = require("@hashgraph/sdk");
const { hashData } = require('../utils/hash');

class HederaService {
    constructor() {
        const accountId = process.env.HEDERA_ACCOUNT_ID;
        const privateKey = process.env.HEDERA_PRIVATE_KEY;
        
        this.client = Client.forTestnet();
        this.client.setOperator(accountId, privateKey);
        this.topicId = process.env.HEDERA_TOPIC_ID;
    }

    async logCall(callData) {
        try {
            console.log('Logging call data:', callData);

            const hashedData = {
                type: 'CALL_START',
                callerHash: hashData(callData.caller || ''),
                timestamp: callData.timestamp,
                callIdHash: hashData(callData.callId || ''),
                verificationCodeHash: hashData(callData.verificationCode || '')
            };

            console.log('Hashed data:', hashedData);

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

    async getMessagesForCode(code, phoneNumber = null) {
        try {
            const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${this.topicId}/messages`;
            
            console.log('Querying mirror node:', mirrorNodeUrl);
            
            const response = await fetch(mirrorNodeUrl);
            if (!response.ok) {
                throw new Error(`Mirror node error: ${response.statusText}`);
            }

            const data = await response.json();
            const messages = [];

            const hashedCode = hashData(code);

            for (const msg of data.messages) {
                try {
                    const messageData = JSON.parse(
                        Buffer.from(msg.message, 'base64').toString()
                    );

                    if (messageData.verificationCodeHash === hashedCode) {
                        if (!phoneNumber || messageData.callerHash === hashData(phoneNumber)) {
                            messages.push({
                                timestamp: messageData.timestamp,
                                consensusTimestamp: msg.consensus_timestamp,
                                sequenceNumber: msg.sequence_number
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            }

            return messages;
        } catch (error) {
            console.error('Error querying mirror node:', error);
            throw error;
        }
    }
}

module.exports = new HederaService();

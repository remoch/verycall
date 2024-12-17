const crypto = require('crypto');

function hashData(data) {
    // Convert data to string if it's not already
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(stringData).digest('hex');
}

module.exports = { hashData };

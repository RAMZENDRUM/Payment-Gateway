const axios = require('axios');

async function testApi() {
    // REPLACE THIS WITH YOUR ACTUAL API KEY
    const API_KEY = 'sk_live_YOUR_API_KEY_HERE';
    const URL = 'http://localhost:5000/api/payments';

    try {
        console.log('🔄 Sending Payment Request...');
        const response = await axios.post(
            URL,
            {
                amount: 1500,
                reference: 'ORDER_TEST_001',
                customer_id: 'cust_demo_1',
                callback_url: 'https://webhook.site/test'
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Payment Created Successfully!');
        console.log('------------------------------------------------');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ API Error:', error.response ? error.response.data : error.message);
    }
}

testApi();

require("dotenv").config();
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const testTwilio = async () => {
    try {
        console.log("Checking Twilio account status...");
        const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log("Account Status:", account.status);
        console.log("Account Type:", account.type);
        console.log("Twilio integration is correctly configured!");
    } catch (error) {
        console.error("Twilio test failed!");
        if (error.code === 20003) {
            console.error("Error: Authentication Error. Your Account SID or Auth Token is incorrect.");
        } else if (error.code === 20404) {
             console.error("Error: Account not found. Check your Account SID.");
        } else {
             console.error("Error message:", error.message);
        }
    }
};

testTwilio();

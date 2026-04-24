require("dotenv").config();
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendTestOTP = async () => {
    const phoneNumber = "7054557595";
    const countryCode = "91";
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    console.log(`Sending OTP ${otp} to +${countryCode}${phoneNumber} via WhatsApp...`);
    
    try {
        const response = await client.messages.create({
            body: `Your EzyDash verification code is: ${otp}`,
            from: "whatsapp:+14155238886", // Twilio Sandbox Number
            to: `whatsapp:+${countryCode}${phoneNumber}`,
        });
        console.log("Success! Message SID:", response.sid);
        console.log("Status:", response.status);
    } catch (error) {
        console.error("Failed to send OTP.");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        if (error.code === 63003) {
            console.error("\nTIP: Since this is a Trial Account, you must first join the WhatsApp Sandbox by sending 'join <your-keyword>' to +1 415 523 8886.");
        }
    }
};

sendTestOTP();

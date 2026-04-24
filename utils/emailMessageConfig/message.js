// const AWS = require("aws-sdk");

// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION || "ap-south-1",
// });

// const ses = new AWS.SES();

// const generateOTP = () => {
//   return Math.floor(1000 + Math.random() * 9000).toString();
// };

// const sendOTP = async (email, otp) => {
//   const expirationTime = 2;
//   const params = {
//     Source: "ranjanaditya5678@gmail.com",
//     Destination: {
//       ToAddresses: [email],
//     },
//     Message: {
//         Subject: {
//             Data: 'Password Reset Request - Your OTP Code'
//         },
//         Body: {
//             Html: {
//                 Data: `
//                     <html>
//                         <body>
//                             <h2>Password Reset Request</h2>
//                             <p>Hello,</p>
//                             <p>We received a request to reset the password for your account.</p>
//                             <p><strong>Your OTP code is: <span style="color:blue;">${otp}</span></strong></p>
//                             <p>This OTP code will expire in <strong>${expirationTime} minutes</strong>.</p>
//                             <p>If you did not request a password reset, please ignore this email.</p>
//                             <p>Thank you,<br/>Ezydash Team</p>
//                         </body>
//                     </html>
//                 `
//             }
//         }
//     }
//   };

//   try {
//     const result = await ses.sendEmail(params).promise();
//     console.log("Email sent:", result);
//     return result;
//   } catch (error) {
//     console.error("Error sending email:", error.message);
//     throw new Error("Failed to send OTP");
//   }
// };

// const sendOtpEmailVerification = async (email, otp) => {
//   const expirationTime = 2;
//   const params = {
//     Source: "ranjanaditya5678@gmail.com",
//     Destination: {
//       ToAddresses: [email],
//     },
//     Message: {
//         Subject: {
//             Data: 'Email Verification Request - Your OTP Code'
//         },
//         Body: {
//             Html: {
//                 Data: `
//                     <html>
//                         <body>
//                             <h2>Email Verification Request</h2>
//                             <p>Hello,</p>
//                             <p>We received a request to verify the email for your account.</p>
//                             <p><strong>Your OTP code is: <span style="color:blue;">${otp}</span></strong></p>
//                             <p>This OTP code will expire in <strong>${expirationTime} minutes</strong>.</p>
//                             <p>If you did not request a password reset, please ignore this email.</p>
//                             <p>Thank you,<br/>Ezydash Team</p>
//                         </body>
//                     </html>
//                 `
//             }
//         }
//     }
//   };

//   try {
//     const result = await ses.sendEmail(params).promise();
//     console.log("Email sent:", result);
//     return result;
//   } catch (error) {
//     console.error("Error sending email:", error.message);
//     throw new Error("Failed to send OTP");
//   }
// };

// module.exports = { generateOTP, sendOTP, sendOtpEmailVerification };


const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendEmail = async (email, subject, htmlContent) => {
  const params = {
    Source: "aditya@softkingo.com",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: htmlContent,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    // console.log("Email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

const sendOTP = async (email, otp) => {
  const expirationTime = 5; // minutes
  const htmlContent = `
    <html>
      <body>
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your account.</p>
        <p><strong>Your OTP code is: <span style="color:blue;">${otp}</span></strong></p>
        <p>This OTP code will expire in <strong>${expirationTime} minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Thank you,<br/>Ezydash Team</p>
      </body>
    </html>
  `;
  return sendEmail(email, "Password Reset Request - Your OTP Code", htmlContent);
};

const sendOtpEmailVerification = async (email, otp) => {
  const expirationTime = 2; // minutes
  const htmlContent = `
    <html>
      <body>
        <h2>Email Verification Request</h2>
        <p>Hello,</p>
        <p>We received a request to verify the email for your account.</p>
        <p><strong>Your OTP code is: <span style="color:blue;">${otp}</span></strong></p>
        <p>This OTP code will expire in <strong>${expirationTime} minutes</strong>.</p>
        <p>If you did not request email verification, please ignore this email.</p>
        <p>Thank you,<br/>Ezydash Team</p>
      </body>
    </html>
  `;
  return sendEmail(email, "Email Verification Request - Your OTP Code", htmlContent);
};

const sendNewDeviceLoginEmail = async (email) => {
  const htmlContent = `
    <html>
      <body>
        <h2>Security Alert: New Device Login Detected</h2>
        <p>Hello,</p>
        <p>We detected a login into your EzeDash account from a new device.</p>
        <p>If this was you, you can safely ignore this email.</p>
        <p><strong>If you did not authorize this login, please take immediate action:</strong></p>
        <ul>
          <li>Go to the App and use the 'Forgot Password' option to reset your password.</li>
          <li>This will secure your account and log out unauthorized users.</li>
        </ul>
        <p>Thank you,<br/>Ezydash Security Team</p>
      </body>
    </html>
  `;
  return sendEmail(email, "Security Alert: New Device Login Detected", htmlContent);
};

module.exports = { generateOTP, sendOTP, sendOtpEmailVerification, sendNewDeviceLoginEmail };

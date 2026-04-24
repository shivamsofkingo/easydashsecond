import React, { useState } from 'react';
import axios from 'axios';

const WhatsappLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');

  const requestOTP = async () => {
    try {
        const response = await axios.post('http://localhost:8000/api/user/sendWhatsappOtp', { phoneNumber });
        console.log("responser", response);
      setMessage(response.data.message);
      setOtpSent(true);
    } catch (error) {
      setMessage("Failed to send OTP. Try again.");
    }
  };

  const verifyOTP = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/user/verifyWhatappOtp', { phoneNumber, otp });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        setMessage("Login successful!");
      }
    } catch (error) {
      setMessage("Invalid OTP or OTP expired.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>WhatsApp Login</h2>

      <div style={styles.inputGroup}>
        <label>Phone Number:</label>
        <input 
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          style={styles.input}
        />
        <button onClick={requestOTP} style={styles.button}>Send OTP</button>
      </div>

      {otpSent && (
        <div style={styles.inputGroup}>
          <label>OTP:</label>
          <input 
            type="text"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
            placeholder="4-digit OTP"
            style={styles.input}
          />
          <button onClick={verifyOTP} style={styles.button}>Verify OTP</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '400px',
    margin: 'auto',
    padding: '20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#28a745',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default WhatsappLogin;
import React, { useEffect } from "react";
import axios from 'axios';

const Task = ({ token, email }) => {

  useEffect(() => {
    if (email) {
      console.log("email ====================", email)
      getUserByEmail(email);
    }
  }, []);

  const getUserByEmail = async(email) => {
    try {

      // const headers = {
      //   Authorization: `Bearer ${token}`,
      // };
      console.log("emaillllllllll", email)
      const response = await axios.get(
        "http://localhost:8000/api/user/getUserByEmail",
        {
          params: { email }
        }
      );
      console.log("yooooooooooooooooooooooooooooooooo", response.data.payload.user._id);
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }

  return (
    <div>
      <h1>List of todo</h1>
    </div>
  );
}

export default Task;
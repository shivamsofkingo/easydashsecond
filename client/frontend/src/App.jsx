import { useState, useEffect } from "react";
import { auth, provider } from "./config/firebase.js";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import Task from "./components/Task.jsx";
import WhatsappLogin from "./components/WhatsappLogin.jsx";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "./redux/userSlice.js";
import io from "socket.io-client"
// import { setSocket } from "./redux/socketSlice.js";

import Chat from "./components/Chat.jsx";

function App() {
  const [authState, setAuthState] = useState(() => {
    return window.localStorage.getItem("auth") === "true";
  });
  // const {} = useSelector(store=>store.user);
  // const {socket} = useSelector(store=>store.socket);

  const [onlineUsers, setOnlineUsers] = useState(null);
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [firstTimeSignIn, setFirstTimeSignIn] = useState(true);
  const [showWhatsappLogin, setShowWhatsappLogin] = useState(false);


  // const dispatch = useDispatch();

  const signInWithGoogle = async () => {
    try {
      const userCred = await signInWithPopup(auth, provider);
      console.log("usercredEmail ===============================>", userCred);
      if (userCred) {
        window.localStorage.setItem("auth", "true");
        setAuthState(true);
        const idToken = await userCred.user.getIdToken();
        setToken(idToken);
        setEmail(userCred.user.email);
        const headers = {
          Authorization: `Bearer ${idToken}`,
        };
        if (!firstTimeSignIn) {
          const response = await axios.post(
            "http://localhost:8000/api/user/googleSignupCreateUser",
            {
              email: userCred.user.email,
              googleId: userCred.user.uid,
            },
            { headers }
          );
          console.log("Backend Response: ", response.data);
          if (response.data.status === 1) {
            console.log(
              "User created successfully:",
              response.data.payload.newUser
            );
          } else {
            console.error("Error from backend:", response.data.msg);
          }
          setFirstTimeSignIn(true);
        }
      }
    } catch (error) {
      console.error("Error during Google login: ", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      window.localStorage.removeItem("auth");
      setAuthState(false);
      setToken(null);
    } catch (error) {
      console.error("Error during logout: ", error);
    }
  };

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (userCred) => {
  //     if (userCred) {
  //       window.localStorage.setItem("auth", "true");
  //       setAuthState(true);
  //       userCred.getIdToken().then((token) => {
  //         setToken(token);
  //       });
  //       const id = getUserByEmail(email);
  //       const socket = io("http://localhost:8000", {
  //         query: {
  //           userId: id
  //         }
  //       });
  //       // dispatch(setSocket(socket));
  //       setSocket(socket)
  //       // socket?.on('getOnlineUsers', (onlineUsers)=>{
  //       //   // dispatch(setOnlineUsers(onlineUsers))
  //       //   setOnlineUsers(onlineUsers);
  //       // });
  //       return () => socket.close();
  //     } else {
  //       window.localStorage.removeItem("auth");
  //       setAuthState(false);
  //       setToken(null);
  //     }
  //   });

  //   const getUserByEmail = async(email) => {
  //     try {

  //       // const headers = {
  //       //   Authorization: `Bearer ${token}`,
  //       // };
  //       console.log("emaillllllllll", email)
  //       const response = await axios.get(
  //         "http://localhost:8000/api/user/getUserByEmail",
  //         {
  //           params: { email }
  //         }
  //       );
  //       const id = response.data.payload.user._id
  //       if(id) {
  //         setAuthUser(response.data.payload.user);
  //       }
  //       return id;

  //     } catch (error) {
  //       console.log('Error:', error.message);
  //     }
  //   }

  //   return () => unsubscribe();
  // }, []);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userCred) => {
      if (userCred) {
        window.localStorage.setItem("auth", "true");
        setAuthState(true);
        const idToken = await userCred.getIdToken();
        setToken(idToken);
        setEmail(userCred.email);
      } else {
        window.localStorage.removeItem("auth");
        setAuthState(false);
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, []);
  

  return (
    <>
      {authState ? (
        <>
          <Chat token={token} email={email}/>
          <button onClick={logout}>Logout</button>
        </>
      ) : showWhatsappLogin ? (
        <WhatsappLogin />
      ) : (
        <>
          <button onClick={signInWithGoogle}>Login with Google</button>
          <button onClick={() => setShowWhatsappLogin(true)}>
            Login with WhatsApp
          </button>
        </>
      )}
    </>
  );
}

export default App;

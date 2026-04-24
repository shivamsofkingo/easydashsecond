import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaIl4SLr62VL0gv0k9vK-gk-u8DsLxQtM",
  authDomain: "ezydash-auth.firebaseapp.com",
  projectId: "ezydash-auth",
  storageBucket: "ezydash-auth.appspot.com",
  messagingSenderId: "251488909647",
  appId: "1:251488909647:web:4ddafa5d8a20771567ed3a",
  measurementId: "G-KXJ2851RNG",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

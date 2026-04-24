import {configureStore} from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import socketReducer from "./socketSlice.js";

const store = configureStore({
    reducer: {
        user: userReducer,
        socket: socketReducer
    }
});

export default store;
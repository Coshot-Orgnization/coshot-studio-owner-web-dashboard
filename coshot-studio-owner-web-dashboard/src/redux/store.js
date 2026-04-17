"use client";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { api } from "./api/api";
import authSlice from "./auth/authSlice";

const reducer = combineReducers({
    [api.reducerPath]: api.reducer,
    auth: authSlice,
});

export const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
});
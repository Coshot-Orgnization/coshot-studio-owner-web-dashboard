"use client";
import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApi";

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    role: "user",
};

const extractTokenFromPayload = (payload) => {
    return (
        payload?.token ??
        payload?.accessToken ??
        payload?.authToken ??
        payload?.jwt ??
        payload?.data?.token ??
        payload?.data?.accessToken ??
        payload?.data?.authToken ??
        payload?.data?.jwt ??
        payload?.data?.data?.token ??
        payload?.data?.data?.accessToken ??
        payload?.data?.data?.authToken ??
        payload?.data?.data?.jwt
    );
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload?.data?.user ?? null;
            state.role = action.payload?.data?.user?.activeRole ?? "user";
            state.isAuthenticated = Boolean(state.user);
        },
        setCredentials: (state, action) => {
            const userData = action.payload?.data?.user ?? action.payload?.data ?? action.payload;
            const token = extractTokenFromPayload(action.payload);
            const role = action.payload?.data?.user?.activeRole ?? userData?.activeRole;
            if (userData !== undefined) {
                state.user = userData;
            }
            if (token !== undefined) {
                state.token = token;
            }
            if (role) {
                state.role = role;
            }
            state.isAuthenticated = Boolean(state.user);
            if (token && typeof window !== "undefined") {
                window.localStorage.setItem("auth_token", token);
            }
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.role = "";
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_token");
            }
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            authApi.endpoints.verifyOtp.matchFulfilled,
            (state, { payload }) => {
                const userData =
                    payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
                const token = extractTokenFromPayload(payload);
                const role =
                    payload?.role ?? payload?.data?.user?.activeRole ?? userData?.activeRole;
                if (userData !== undefined) {
                    state.user = userData;
                }
                if (token !== undefined) {
                    state.token = token;
                }
                if (role) {
                    state.role = role;
                }
                state.isAuthenticated = Boolean(state.user);
                if (token && typeof window !== "undefined") {
                    window.localStorage.setItem("auth_token", token);
                }
            }
        );
    },
});

export const { setUser, setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;
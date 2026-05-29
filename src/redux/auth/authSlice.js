"use client";
import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApi";

const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    role: "user",
};

const extractTokenFromPayload = (payload) => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    return {
        accessToken: data?.accessToken ?? data?.token ?? data?.authToken ?? data?.jwt,
        refreshToken: data?.refreshToken ?? data?.refresh_token
    };
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
            const { accessToken, refreshToken } = extractTokenFromPayload(action.payload);
            const userData = action.payload?.data?.user ?? action.payload?.user;
            const role = action.payload?.data?.user?.activeRole ?? action.payload?.user?.activeRole ?? action.payload?.role;
            
            if (accessToken) {
                state.token = accessToken;
                if (typeof window !== "undefined") {
                    window.localStorage.setItem("auth_token", accessToken);
                }
            }

            if (refreshToken) {
                state.refreshToken = refreshToken;
                if (typeof window !== "undefined") {
                    window.localStorage.setItem("refresh_token", refreshToken);
                }
            }
            
            if (userData) {
                state.user = userData;
                state.isAuthenticated = true;
            }
            
            if (role) {
                state.role = role;
            }
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.role = "";
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_token");
                window.localStorage.removeItem("refresh_token");
            }
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            authApi.endpoints.verifyOtp.matchFulfilled,
            (state, { payload }) => {
                const userData =
                    payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
                const { accessToken, refreshToken } = extractTokenFromPayload(payload);
                const role =
                    payload?.role ?? payload?.data?.user?.activeRole ?? userData?.activeRole;
                
                if (userData !== undefined) {
                    state.user = userData;
                }
                
                if (accessToken) {
                    state.token = accessToken;
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem("auth_token", accessToken);
                    }
                }

                if (refreshToken) {
                    state.refreshToken = refreshToken;
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem("refresh_token", refreshToken);
                    }
                }

                if (role) {
                    state.role = role;
                }
                state.isAuthenticated = Boolean(state.user);
            }
        );
    },
});

export const { setUser, setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;
import { api } from "../api/api";

export const authApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        sendOtp: builder.mutation({
            query: (body) => ({
                url: "/auth/otp/send",
                method: "POST",
                body,
            }),
        }),

        verifyOtp: builder.mutation({
            query: (body) => ({
                url: "/auth/otp/verify",
                method: "POST",
                body,
            }),
        }),

        refeshAccessToken: builder.mutation({
            query: () => ({
                url: "/auth/refresh-token",
                method: "POST",
            }),
        }),

        logOut: builder.mutation({
            query: (body) => ({
                url: "/auth/logout",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const { useSendOtpMutation, useVerifyOtpMutation, useRefeshAccessTokenMutation, useLogOutMutation } = authApi;
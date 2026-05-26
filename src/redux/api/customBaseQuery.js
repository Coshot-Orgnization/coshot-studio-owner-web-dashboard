import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { logOut, setCredentials } from "../auth/authSlice";
export const Url = process.env.NEXT_PUBLIC_API_URL || "https://maida-acheilary-luisa.ngrok-free.dev";

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

const baseQuery = fetchBaseQuery({
    baseUrl: Url,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
    },
    prepareHeaders: (headers) => {
        headers.set("x-client-platform", "web");

        if (typeof window !== "undefined") {
            const token = window.localStorage.getItem("auth_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
        }
        return headers;
    },

});
const customBaseQuery = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    const { error } = result;
    if (error && (error?.status === 401 || error?.originalStatus === 401)) {
        const refreshResult = await baseQuery(
            {
                url: "/auth/refresh-token",
                method: "POST",
            },
            api,
            extraOptions
        );

        if (refreshResult?.data) {
            const refreshedToken = extractTokenFromPayload(refreshResult.data);
            if (refreshedToken) {
                api.dispatch(setCredentials({ token: refreshedToken }));
            }
            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch(logOut());
        }
    }
    return result;
};

export default customBaseQuery;

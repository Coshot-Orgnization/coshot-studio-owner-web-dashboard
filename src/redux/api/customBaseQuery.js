import { fetchBaseQuery } from "@reduxjs/toolkit/query";
export const Url = process.env.NEXT_PUBLIC_API_URL || "https://maida-acheilary-luisa.ngrok-free.dev";

const extractTokenFromPayload = (payload) => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    return {
        accessToken: data?.accessToken ?? data?.token ?? data?.authToken ?? data?.jwt,
        refreshToken: data?.refreshToken ?? data?.refresh_token
    };
};

const baseQuery = fetchBaseQuery({
    baseUrl: Url,
    credentials: 'include',
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
let refreshPromise = null;

const customBaseQuery = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && (result.error.status === 401 || result.error.originalStatus === 401)) {
        console.warn("401 detected, attempting to refresh token...", args.url);

        // Prevent infinite loop if refresh token itself fails with 401
        if (args.url === "/auth/refresh-token" || args.url === "auth/refresh-token") {
            console.error("Refresh token API failed with 401. Logging out.");
            api.dispatch({ type: "auth/logOut" });
            return result;
        }

        // If a refresh is already in progress, wait for it
        if (!refreshPromise) {
            const refreshToken = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
            
            refreshPromise = baseQuery(
                {
                    url: "/auth/refresh-token",
                    method: "POST",
                    body: { refreshToken } // Sending the dedicated refresh token
                },
                api,
                extraOptions
            );
        }

        const refreshResult = await refreshPromise;

        // Clear promise regardless of result to allow future refreshes
        if (refreshPromise) {
            refreshPromise = null;
        }

        if (refreshResult?.data) {
            const { accessToken, refreshToken: newRefreshToken } = extractTokenFromPayload(refreshResult.data);
            if (accessToken) {
                console.log("Token refreshed successfully.");
                // Update local storage and store
                api.dispatch({ type: "auth/setCredentials", payload: refreshResult.data });

                // Retry the original query with the new token
                result = await baseQuery(args, api, extraOptions);
            } else {
                console.error("No access token found in refresh response:", refreshResult.data);
                api.dispatch({ type: "auth/logOut" });
            }
        } else {
            console.error("Refresh token API failed deeply:", JSON.stringify(refreshResult.error, null, 2));
            api.dispatch({ type: "auth/logOut" });
        }
    }
    return result;
};

export default customBaseQuery;

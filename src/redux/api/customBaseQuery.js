import { fetchBaseQuery } from "@reduxjs/toolkit/query";
export const Url = process.env.NEXT_PUBLIC_API_URL || "https://maida-acheilary-luisa.ngrok-free.dev";

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
        api.dispatch({ type: "auth/logOut" });
    }
    return result;
};

export default customBaseQuery;

import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "./customBaseQuery";

export const api = createApi({
    reducerPath: "api",
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({}),
    tagTypes: [],
});

export const { resetApiState } = api;

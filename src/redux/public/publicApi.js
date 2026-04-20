import { api } from "../api/api";

export const publicApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        categoriesList: builder.query({
            query: () => ({
                url: "/public/master-data/studio-categories",
                method: "GET",
            }),
        }),
        amenitiesList: builder.query({
            query: () => ({
                url: "/public/master-data/studio-amenities",
                method: "GET",
            }),
        }),
        refundPoliciesList: builder.query({
            query: () => ({
                url: "/public/master-data/refund-policy",
                method: "GET",
            }),
        }),
    }),
})

export const { useCategoriesListQuery, useAmenitiesListQuery, useRefundPoliciesListQuery } = publicApi;
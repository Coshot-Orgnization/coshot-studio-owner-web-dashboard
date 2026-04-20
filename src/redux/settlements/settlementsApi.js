import { api } from "../api/api";

export const settlementsApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getSettlementsSummary: builder.query({
            query: () => ({
                url: `/studio-owner/settlements/summary`,
                method: "GET",
            }
            ),
        }),
        getSettlementsHistory: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        searchParams.append(key, String(value));
                    }
                });
                return {
                    url: `/studio-owner/settlements?${searchParams.toString()}`,
                    method: "GET",
                };
            },
        }),
        getSettlementDetails: builder.query({
            query: (id) => ({
                url: `/studio-owner/settlements/${id}`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGetSettlementsSummaryQuery,
    useGetSettlementsHistoryQuery,
    useGetSettlementDetailsQuery,
} = settlementsApi;
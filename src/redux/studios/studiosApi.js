import { api } from "../api/api";

export const studiosApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        studioOwnerStudioList: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        searchParams.append(key, String(value));
                    }
                })
                return {
                    url: `/studio/my-studios?${searchParams.toString()}`,
                    method: "GET",
                }
            },
        }),
        createStudiDraft: builder.mutation({
            query: () => ({
                url: "/studio",
                method: "POST",
            }),
        }),
        getCurrentStudioDraft: builder.query({
            query: (id) => ({
                url: `/studio/draft`,
                method: "GET",
            }),
        }),
        createStudio: builder.mutation({
            query: (body) => ({
                url: `/studio/${body?.studioId}/step/${body?.step}`,
                method: "PATCH",
                body,
            }),
        }),
        getStudioDetails: builder.query({
            query: (id) => ({
                url: `/studio/${id}`,
                method: "GET",
            }),
        }),
        submitStudioForApproval: builder.mutation({
            query: (body) => ({
                url: `/studio/${body?.id}/submit`,
                method: "POST",
            }),
        }),
        getStudioBlockedDates: builder.query({
            query: (id) => ({
                url: `/studio/${id}/blocked-dates`,
                method: "GET",
            }),
        }),
        saveStudioBlockedDates: builder.mutation({
            query: (body) => ({
                url: `/studio/${body?.studioId}/blocked-dates`,
                method: "POST",
                body: {
                    dates: body?.blockedDates || [],
                },
            }),
        }),
        deleteStudioBlockedDates: builder.mutation({
            query: (body) => ({
                url: `/studio/${body?.studioId}/blocked-dates`,
                method: "DELETE",
                body: {
                    dates: body?.blockedDates || [],
                },
            }),
        }),
        GetStudioDetailsOwnerView: builder.query({
            query: (id) => ({
                url: `/studio/${id}`,
                method: "GET",
            }),
        }),
        discountRulesToggle: builder.mutation({
            query: (body) => ({
                url: `/studio/${body?.studioId}/discount-rules/${body?.ruleId}/toggle`,
                method: "PATCH",
                body: body
            }),
        }),
    }),
});

export const {
    useStudioOwnerStudioListQuery,
    useCreateStudiDraftMutation,
    useGetCurrentStudioDraftQuery,
    useCreateStudioMutation,
    useGetStudioDetailsQuery,
    useSubmitStudioForApprovalMutation,
    useGetStudioBlockedDatesQuery,
    useSaveStudioBlockedDatesMutation,
    useDeleteStudioBlockedDatesMutation,
    useGetStudioDetailsOwnerViewQuery,
    useDiscountRulesToggleMutation,
} = studiosApi;
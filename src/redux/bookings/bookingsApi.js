import { api } from "../api/api";

export const bookingsApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        slotList: builder.query({
            query: (params) => ({
                url: `/booking/studios/${params?.id}/slots?date=${params?.date}`,
                method: "GET",
            }),
        }),
        refundStatus: builder.query({
            query: (id) => ({
                url: `/booking/${id}/refund-status`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useSlotListQuery, useRefundStatusQuery
} = bookingsApi;
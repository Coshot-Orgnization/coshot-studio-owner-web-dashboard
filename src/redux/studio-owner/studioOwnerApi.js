import { api } from "../api/api";

export const studioOwnerApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getStudioOwnerProfile: builder.query({
            query: () => ({
                url: "/studio-owner/profile",
                method: "GET",
            }),
        }),

        updateStudioProfile: builder.mutation({
            query: (data) => ({
                url: "/studio-owner/profile",
                method: "PATCH",
                body: data,
            }),
        }),

        bookingsRevenue: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        searchParams.append(key, String(value));
                    }
                })
                return {
                    url: `/studio-owner/bookings/revenue?${searchParams.toString()}`,
                    method: "GET",
                }
            },
        }),

        offlineBooking: builder.mutation({
            query: (data) => ({
                url: `/studio-owner/bookings/studio/${data?.studioId}/offline`,
                method: "POST",
                body: data,
            }),
        }),

        sendEmailVerificationOtp: builder.mutation({
            query: () => ({
                url: `/studio-owner/email/send-otp`,
                method: "POST",
            }),
        }),

        verifyOwnerEmailOtp: builder.mutation({
            query: (data) => ({
                url: `/studio-owner/email/verify`,
                method: "POST",
                body: data,
            }),
        }),

        studioOwnerRefundStatus: builder.query({
            query: (bookingId) => ({
                url: `/studio-owner/bookings/${bookingId}/refund-status`,
                method: "GET",
            }),
        }),

        studioOwnerBookingList: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();

                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        searchParams.append(key, String(value));
                    }
                })
                return {
                    url: `/studio-owner/bookings?${searchParams.toString()}`,
                    method: "GET",
                }
            },
        }),

        cancelBookingByOwner: builder.mutation({
            query: (data) => ({
                url: `/studio-owner/bookings/${data.id}/cancel`,
                method: "POST",
                body: {
                    cancellationReason: data.cancellationReason,
                },
            }),
        }),

        studioOwnerDashboardStats: builder.query({
            query: () => ({
                url: "/studio-owner/dashboard/stats",
                method: "GET",
            }),
        }),

        deleteUserProfile: builder.mutation({
            query: (body) => ({
                url: "/account/delete/initiate",
                method: "POST",
                body,
            }),
        }),

        uploadImageUrl: builder.mutation({
            query: (body) => ({
                url: "/media/upload-url",
                method: "POST",
                body,
            }),
        }),

        confirmDeleteUserProfile: builder.mutation({
            query: (body) => ({
                url: "/account/profile",
                method: "DELETE",
                body,
            }),
        }),
    }),
})

export const { useGetStudioOwnerProfileQuery, useUpdateStudioProfileMutation, useBookingsRevenueQuery, useOfflineBookingMutation, useSendEmailVerificationOtpMutation, useVerifyOwnerEmailOtpMutation, useStudioOwnerRefundStatusQuery,
    useStudioOwnerBookingListQuery, useCancelBookingByOwnerMutation, useStudioOwnerDashboardStatsQuery, useDeleteUserProfileMutation, useUploadImageUrlMutation, useConfirmDeleteUserProfileMutation } = studioOwnerApi;
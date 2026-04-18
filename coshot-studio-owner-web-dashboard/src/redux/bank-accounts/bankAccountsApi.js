import { api } from "../api/api";

export const bankAccountsApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        addBankAccount: builder.mutation({
            query: (body) => ({
                url: "/bank-accounts",
                method: "POST",
                body,
            }),
        }),
        getOwnerBankAccountDetails: builder.query({
            query: () => ({
                url: `/bank-accounts`,
                method: "GET",
            }),
        }),
        updateOwnerBankAccountDetails: builder.mutation({
            query: (data) => ({
                url: `/bank-accounts`,
                method: "PATCH",
                body: data,
            }),
        }),
    }),
})

export const {
    useAddBankAccountMutation, useGetOwnerBankAccountDetailsQuery, useUpdateOwnerBankAccountDetailsMutation,
} = bankAccountsApi;
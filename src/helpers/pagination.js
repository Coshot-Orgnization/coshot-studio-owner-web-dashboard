export const DEFAULT_PAGINATION = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const getPaginationFromResponse = (response, defaultLimit = 20) => {
    const pagination =
        response?.data?.pagination ||
        response?.data?.meta ||
        response?.pagination ||
        response?.meta ||
        {};

    const page = Math.max(1, toNumber(pagination?.page || pagination?.currentPage, 1));
    const limit = Math.max(
        1,
        toNumber(pagination?.limit || pagination?.perPage, defaultLimit || DEFAULT_PAGINATION.limit)
    );
    const total = Math.max(
        0,
        toNumber(pagination?.total || pagination?.totalItems || response?.data?.total, 0)
    );
    const totalPages = Math.max(
        1,
        toNumber(
            pagination?.totalPages || pagination?.lastPage || pagination?.pages,
            total > 0 ? Math.ceil(total / limit) : 1
        )
    );

    const hasNext =
        typeof pagination?.hasNext === "boolean"
            ? pagination.hasNext
            : page < totalPages;
    const hasPrevious =
        typeof pagination?.hasPrevious === "boolean"
            ? pagination.hasPrevious
            : page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
    };
};
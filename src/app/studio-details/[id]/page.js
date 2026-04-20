import StudioDetailsByOwner from '@/components/StudioDetailsByOwner';
import React from 'react'

const page = async ({ params }) => {
    const resolvedParams = await Promise.resolve(params);

    if (!resolvedParams) {
        notFound();
    }

    return <StudioDetailsByOwner id={resolvedParams?.id} />;
};

export default page
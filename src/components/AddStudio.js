"use client";
import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import { useCreateStudiDraftMutation, useGetStudioDetailsQuery } from '@/redux/studios/studiosApi'
import { useRouter } from 'next/navigation';

const AddStudio = () => {
    const [createDraft] = useCreateStudiDraftMutation();
    const [studioId, setStudioId] = useState("");
    const router = useRouter();

    useEffect(() => {
        createDraft().then((res) => {
            setStudioId(res?.data?.data?.studioId)
        }).catch((err) => {
            console.log("err", err);
        })
    }, [])
    localStorage.setItem("studioId", studioId || "")
    const { data } = useGetStudioDetailsQuery(studioId);

    useEffect(() => {
        if (data?.data) {
            if (data?.data?.draftStep == 1) {
                router.push("/add-studio/studio-basic-information")
            } else if (data?.data?.draftStep == 2) {
                router.push("/add-studio/pricing-booking")
            } else if (data?.data?.draftStep == 3) {
                router.push("/add-studio/manage-availability")
            } else if (data?.data?.draftStep == 4) {
                router.push("/add-studio/amenities-and-inclusions")
            } else if (data?.data?.draftStep == 5) {
                router.push("/add-studio/rules")
            } else if (data?.data?.draftStep == 6) {
                router.push("/add-studio/location")
            } else if (data?.data?.draftStep == 7) {
                router.push("/add-studio/studio-photos")
            } else if (data?.data?.draftStep == null) {
                router.push("/add-studio/studio-preview")
            }
        }
    }, [data])

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="w-full rounded-tr-[300px] h-200 bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 lg:mt-15 text-[28px] font-semibold text-[#2f2d3a]">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>
            </div>
        </main>
    )
}

export default AddStudio
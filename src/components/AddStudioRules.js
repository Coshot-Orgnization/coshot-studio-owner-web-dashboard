"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useRefundPoliciesListQuery } from "@/redux/public/publicApi";
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";

const AddStudioRules = () => {
    const router = useRouter();
    const [studioId, setStudioId] = useState("");

    useEffect(() => {
        setStudioId(localStorage.getItem("studioId") || "");
    }, []);

    const hasPrefilledRef = useRef(false);
    const { data } = useRefundPoliciesListQuery();
    const [createStudio, { isLoading }] = useCreateStudioMutation();
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    const [hostRules, setHostRules] = useState([
        { id: "r1", text: "Smoking, alcohol, and drugs are not allowed inside the studio.", checked: true },
        { id: "r2", text: "Guests must arrive and leave within the booked time slot.", checked: false },
        { id: "r3", text: "Any damage to equipment or property will be chargeable.", checked: true },
        { id: "r4", text: "Keep the studio clean and return items to their original place.", checked: false },
    ]);
    const [newRule, setNewRule] = useState("");
    const [showAddRuleField, setShowAddRuleField] = useState(false);

    useEffect(() => {
        if (hasPrefilledRef.current || !studioDetails?.data) return;
        hasPrefilledRef.current = true;

        const prefilledRules = (studioDetails?.data?.hostRules || [])
            .map((rule) => (typeof rule === "string" ? rule : rule?.text || rule?.name || ""))
            .filter(Boolean)
            .map((text, index) => ({
                id: `prefilled-${index}`,
                text,
                checked: true,
            }));

        queueMicrotask(() => {
            if (prefilledRules.length > 0) {
                setHostRules(prefilledRules);
            }
        });
    }, [studioDetails]);

    const normalizedPolicies = useMemo(
        () =>
            (data?.data || [])
                .map((item) => (typeof item === "string" ? item : item?.description || item?.title || ""))
                .filter(Boolean),
        [data?.data]
    );

    const toggleRule = (id) => {
        setHostRules((prev) =>
            prev.map((rule) => (rule.id === id ? { ...rule, checked: !rule.checked } : rule))
        );
    };

    const addRule = () => {
        const value = newRule.trim();
        if (!value) return;

        setHostRules((prev) => [
            ...prev,
            {
                id: `r${Date.now()}`,
                text: value,
                checked: true,
            },
        ]);
        setNewRule("");
        setShowAddRuleField(false);
    };

    const onContinue = async () => {
        if (!studioId) {
            showErrorToast("Studio ID not found. Please complete previous steps first.");
            return;
        }

        const selectedRules = hostRules
            .filter((rule) => rule.checked)
            .map((rule) => rule.text.trim())
            .filter(Boolean);

        if (selectedRules.length === 0) {
            showErrorToast("Please select at least one host rule.");
            return;
        }

        const res = await createStudio({
            studioId,
            step: 5,
            hostRules: selectedRules,
        });

        if (res?.data) {
            showSuccessToast(res?.data?.message || "Rules saved successfully.");
            router.push("/add-studio/location");
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block w-full rounded-tr-[300px] h-200 bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 lg:mt-15 text-[28px] font-semibold text-[#2f2d3a]">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-300">
                    <div className="flex justify-between px-6 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-10">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Rules</h1>
                            <p className="max-w-88.75 text-[13px] leading-4 text-[#444356]">
                                Set clear expectations for guests before they book your studio.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-5 px-6 py-7 md:px-10 md:py-8">
                        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                            <h3 className="text-[20px] font-semibold text-[#2f2d3a]">Host Rules</h3>
                            <p className="text-[17px] text-[#444356]">Add rules guests must follow while using your studio.</p>
                        </div>

                        <div className="space-y-4">
                            {hostRules.map((rule) => (
                                <label key={rule.id} className="flex items-center gap-3 text-[14px] text-[#4a465f]">
                                    <input
                                        type="checkbox"
                                        checked={rule.checked}
                                        onChange={() => toggleRule(rule.id)}
                                        className="h-4 w-4 cursor-pointer rounded-sm border border-[#d5d6dd] accent-[#6D5EF6]"
                                    />
                                    <span>{rule.text}</span>
                                </label>
                            ))}
                        </div>

                        {!showAddRuleField ? (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRuleField(true)}
                                    className="h-10 rounded-full bg-linear-to-r from-[#171717] to-[#4a4a4a] px-6 text-[16px] font-medium text-white cursor-pointer"
                                >
                                    + Add Rule
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <input
                                    type="text"
                                    value={newRule}
                                    onChange={(event) => setNewRule(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addRule();
                                        }
                                    }}
                                    placeholder="Add custom rule"
                                    className="h-11 w-full rounded-full border border-[#dfdde7] bg-white px-5 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden sm:max-w-md"
                                />

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={addRule}
                                        className="h-10 rounded-full bg-linear-to-r from-[#171717] to-[#4a4a4a] px-6 text-[16px] font-medium text-white cursor-pointer"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddRuleField(false);
                                            setNewRule("");
                                        }}
                                        className="h-10 rounded-full border border-[#d7d5e4] bg-white px-6 text-[14px] font-medium text-[#4a465f] cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2 mb-0 md:grid-cols-[1fr_auto] md:items-start mt-8">
                            <h3 className="text-[20px] font-semibold text-[#2f2d3a]">Cancellation Policy (By CoShot)</h3>
                            <p className="max-w-105 text-end text-[15px] leading-6 text-[#444356]">
                                This cancellation policy is managed by CoShot and applies uniformly to all studio bookings.
                            </p>
                        </div>

                        <ul className="space-y-2 pl-2 text-[14px] leading-6 text-[#444356]">
                            {normalizedPolicies.length > 0 ? (
                                normalizedPolicies.map((policy, index) => (
                                    <li key={`${policy}-${index}`} className="flex gap-2">
                                        <span>•</span>
                                        <span>{policy}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-[14px] text-[#8e8aa1]">Cancellation policy is currently unavailable.</li>
                            )}
                        </ul>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-6 md:px-10 md:py-7">
                        <div className="flex justify-center md:justify-end">
                            <button
                                type="button"
                                onClick={onContinue}
                                disabled={isLoading}
                                className="h-12 w-full max-w-53.5 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[18px] font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                            >
                                {isLoading ? "Saving..." : "Save & Continue"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </main>
    );
};

export default AddStudioRules;
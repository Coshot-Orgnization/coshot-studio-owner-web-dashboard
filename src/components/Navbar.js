"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoutModal from "@/modals/LogoutModal";
import { useLogOutMutation } from "@/redux/auth/authApi";
import { showSuccessToast } from "@/helpers/toast";
import WarningModal from "@/modals/WarningModal";
import { useGetCurrentStudioDraftQuery, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";

const Chevron = ({ active }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${active ? "text-[#6d5ef6]" : "text-[#565169]"}`}
    >
        <path
            d="M10 17L15 12L10 7"
            stroke="#6D5EF6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const SuccessIcon = () => (
    <svg width="25" height="25" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="15" fill="#22C55E" />
        <path
            d="M10 15.5L13.2 18.5L20 11.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);



const Navbar = ({ onLogout }) => {
    const pathName = usePathname();
    const router = useRouter();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [studioId, setStudioId] = useState("");
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState("");
    const [logOut] = useLogOutMutation();

    useEffect(() => {
        setStudioId(localStorage.getItem("studioId") || "");
    }, []);

    const isAddStudioFlow = pathName.includes("/add-studio");
    const { data: studioDraftData } = useGetCurrentStudioDraftQuery(undefined, {
        skip: !isAddStudioFlow,
    });

    const { data: currentStep } = useGetStudioDetailsQuery(studioId, {
        skip: !isAddStudioFlow || !studioId,
        refetchOnMountOrArgChange: true,
    });

    const rawCompletedSteps =
        currentStep?.data?.draftCompletedSteps ??
        studioDraftData?.data?.draftCompletedSteps ??
        [];

    const completedSteps = Array.isArray(rawCompletedSteps)
        ? rawCompletedSteps
            .map((step) => Number(step))
            .filter((step) => Number.isFinite(step) && step > 0)
        : [];

    const completedStepsSet = new Set(completedSteps);

    const NavButton = ({ label, active = false, onClick, children, showSuccess = false, disabled = false }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center gap-3 px-4 py-4 text-left ${active ? !pathName.includes("/add-studio") ? "customBackgroud" : "customBackgroudSetup" : "hover:bg-[#f6f6fb]"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
            <span className="flex items-center justify-center rounded-lg bg-[#EBE9FF]">{children}</span>
            <span className={`flex-1  text-md font-medium ${active ? "text-[#262338]" : "text-[#434054]"}`}>
                {label}
            </span>
            {showSuccess ? <SuccessIcon /> : <Chevron active={active} />}
        </button>
    );

    const hostNavbarItems = [
        { label: "Dashboard", imageUrl: "/images/navbar/dashboard.png", path: "/" },
        { label: "Host Details", imageUrl: "/images/navbar/profile.png", path: "/profile" },
        { label: "Bookings", imageUrl: "/images/navbar/bookings.png", path: "/bookings" },
        { label: "Add Studio", imageUrl: "/images/navbar/addStudio.png", path: "/add-studio" },
        { label: "My Studio", imageUrl: "/images/navbar/myStudios.png", path: "/my-studios" },
        { label: "View Block Dates", imageUrl: "/images/navbar/bookings.png", path: "/view-blocked-dates" },
        { label: "Earnings", imageUrl: "/images/navbar/earnings.png", path: "/earnings" },
        { label: "Help & Support", imageUrl: "/images/navbar/support.png", path: "/support" },
        { label: "Log out", imageUrl: "/images/navbar/logout.png", path: "", onClick: onLogout, isLogout: true },
    ]

    const studioSetupSteps = [
        { label: "Studio Basics Information", path: "/add-studio/studio-basic-information" },
        { label: "Pricing & Booking", path: "/add-studio/pricing-booking" },
        { label: "Manage Availability", path: "/add-studio/manage-availability" },
        { label: "Amenities & Inclusions", path: "/add-studio/amenities-and-inclusions" },
        { label: "Rules", path: "/add-studio/rules" },
        { label: "Location", path: "/add-studio/location" },
        { label: "Studio Photos", path: "/add-studio/studio-photos" },
        { label: "Studio Preview", path: "/add-studio/studio-preview" },
    ]

    const handleConfirmLogout = async () => {
        try {
            setIsLoggingOut(true);
            const res = await logOut()
            showSuccessToast(res?.data?.message || "Logged out successfully.")

            setIsLogoutModalOpen(false);
            router.push("/")
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleItemClick = (item) => {
        if (item?.isLogout) {
            setIsMobileDrawerOpen(false);
            setIsLogoutModalOpen(true);
            return;
        }

        if (item?.onClick) {
            setIsMobileDrawerOpen(false);
            item.onClick();
            return;
        }

        if (item?.path) {
            setIsMobileDrawerOpen(false);
            router.push(item.path);
        }
    };

    const handleWarningConfirm = () => {
        setIsWarningModalOpen(false);
        setIsMobileDrawerOpen(false);
        if (pendingPath) {
            router.push(pendingPath);
            setPendingPath("");
        }
    };

    const activeNavBarItems = () => {
        if (!pathName.includes("/add-studio")) {
            return hostNavbarItems
        } else if (pathName.includes("/add-studio")) {
            return studioSetupSteps
        }
    }
    const renderNavItems = () => (
        <nav className="space-y-3">
            {activeNavBarItems().map((item, index) => {
                const isStudioSetupItem = studioSetupSteps.includes(item);
                const activeStudioStepIndex = studioSetupSteps.findIndex((step) => step.path === pathName);
                const activeStudioStep = activeStudioStepIndex >= 0 ? activeStudioStepIndex + 1 : 0;
                const totalStudioSteps = studioSetupSteps.length;

                let contiguousCompletedStep = 0;
                while (completedStepsSet.has(contiguousCompletedStep + 1)) {
                    contiguousCompletedStep += 1;
                }

                const nextAllowedStepFromCompletion = Math.min(totalStudioSteps, contiguousCompletedStep + 1);
                const effectiveStep = Math.max(nextAllowedStepFromCompletion, activeStudioStep || 1);
                const allowedStep = effectiveStep > 0 ? effectiveStep : 1;

                const showSuccess = isStudioSetupItem && completedStepsSet.has(index + 1);
                const isNextStepLocked =
                    isStudioSetupItem &&
                    index + 1 > allowedStep;

                return (
                    <NavButton
                        key={item.label}
                        label={item.label}
                        active={Boolean(item.path) && (item.path === pathName || (item.path !== "/" && pathName.startsWith(`${item.path}/`)))}
                        onClick={() => !isNextStepLocked && handleItemClick(item)}
                        showSuccess={showSuccess}
                        disabled={isNextStepLocked}
                    >
                        {!studioSetupSteps.includes(item) && (
                            <Image
                                src={item.imageUrl}
                                alt={item.label}
                                width={20}
                                height={20}
                                className="m-2 h-5 w-5 object-contain"
                            />
                        )}
                    </NavButton>
                );
            })}
        </nav>
    );

    const onCloseWarning = () => {
        setIsWarningModalOpen(false);
        setIsMobileDrawerOpen(false);
    };


    return (
        <>
            <div className="lg:hidden p-1 w-12">
                <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="rounded-md p-2 text-[#262338] hover:bg-black/5 bg-white"
                    aria-label="Open menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                        aria-hidden="true"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            <div
                className={`fixed inset-0 z-50 lg:hidden ${isMobileDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
                aria-hidden={!isMobileDrawerOpen}
            >
                <div
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`absolute inset-0 bg-gray-900/50 transition-opacity duration-300 ${isMobileDrawerOpen ? "opacity-100" : "opacity-0"}`}
                />

                <div className="absolute inset-y-0 left-0 flex w-full justify-start">
                    <div
                        className={`pointer-events-auto relative h-full w-xs max-w-md transform bg-white py-6 shadow-xl transition duration-300 ease-in-out ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
                    >
                        <div className={`flex justify-between items-start px-4 pb-4 sm:pb-0`}>
                            <p className=" text-xl font-medium text-gray-800">{pathName.includes("/add-studio") ? "Studio Setup Steps" : "Menu"}</p>
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="relative rounded-md text-gray-500 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                <span className="absolute -inset-2.5" />
                                <span className="sr-only">Close panel</span>
                                <span aria-hidden="true" className="text-2xl leading-none">×</span>
                            </button>
                        </div>
                        <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />

                        <div className="flex flex-col h-full">
                            <div className="relative flex-1 overflow-y-auto pr-2 mt-2 after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-black/10">
                                {renderNavItems()}
                            </div>
                            {pathName.includes("/add-studio") && <div className="px-4 py-3 border-t border-dashed border-[#e3e2ec]">
                                <button
                                    onClick={() => {
                                        setPendingPath("/");
                                        setIsWarningModalOpen(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-full text-md font-semibold text-[#434054] hover:bg-gray-50 transition-colors cursor-pointer mb-8"
                                >
                                    Back to Dashboard
                                </button>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>

            <aside className={`hidden w-full self-start lg:block ${!pathName.includes("/add-studio") ? "customPathnameCss lg:w-70 bg-white rounded-2xl shadow-lg" : "lg:w-85"} py-5 `}>
                {renderNavItems()}
                {pathName.includes("/add-studio") && <div className="ms-3">
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 p-4 mt-12 text-left hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                            setPendingPath("/");
                            setIsWarningModalOpen(true);
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#6d5ef6]"
                        >
                            <path
                                d="M14 17L9 12L14 7"
                                stroke="#6D5EF6"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="font-semibold text-[#434054]"> Back to Dashboard </span>
                    </button>
                </div>}
            </aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleConfirmLogout}
                isLoading={isLoggingOut}
            />

            <WarningModal
                isOpen={isWarningModalOpen}
                onClose={() => onCloseWarning()}
                onConfirm={handleWarningConfirm}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to leave without saving? Your progress on this step may be lost."
            />
        </>
    );
};

export default Navbar;
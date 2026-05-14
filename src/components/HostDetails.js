"use client";
import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import ImageUploadModal from '@/modals/ImageUploadModal';
import AddBankAccountDetailsModal from '@/modals/AddBankAccountDetailsModal';
import { showErrorToast, showSuccessToast } from '@/helpers/toast';
import { imageSrcHandler } from '@/helpers/imageSrcHandler';
import RejectedModal from '@/modals/RejectedModal';
import WarningModal from '@/modals/WarningModal';
import OtpVerificationModal from '@/modals/OtpVerificationModal';
import { useConfirmDeleteUserProfileMutation, useDeleteUserProfileMutation, useGetStudioOwnerProfileQuery, useSendEmailVerificationOtpMutation, useUpdateStudioProfileMutation, useVerifyOwnerEmailOtpMutation } from '@/redux/studio-owner/studioOwnerApi';
import { useGetOwnerBankAccountDetailsQuery } from '@/redux/bank-accounts/bankAccountsApi';

const HostDetails = () => {
    const { data, isLoading, isFetching, refetch: fetchProfile } = useGetStudioOwnerProfileQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const [updateProfile] = useUpdateStudioProfileMutation();
    const [deleteOwnerProfile, { isLoading: isDeleting }] = useDeleteUserProfileMutation();
    const [confirmDeleteProfile, { isLoading: isConfirmingDelete }] = useConfirmDeleteUserProfileMutation();

    const profile = useMemo(() => {
        const payload = data?.data?.data ?? data?.data ?? data ?? {};
        return payload?.profile ?? payload ?? {};
    }, [data]);

    const profileStatus = data?.data?.profileContext

    const [formValues, setFormValues] = useState({
        ownerName: '',
        email: '',
        phone: '',
        alternatePhone: '',
    });
    const [activeUploadType, setActiveUploadType] = useState(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [govIdUpload, setGovIdUpload] = useState({ fileName: '', uploadedPath: '' });
    const [businessProofUpload, setBusinessProofUpload] = useState({ fileName: '', uploadedPath: '' });
    const [showBankAccountModal, setShowBankAccountModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteOtpModalOpen, setIsDeleteOtpModalOpen] = useState(false);
    const [confirmationToken, setConfirmationToken] = useState('');
    const [deleteWarning, setDeleteWarning] = useState({ isOpen: false, type: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = useState(false);
    const [profileImageUpload, setProfileImageUpload] = useState({ fileName: '', uploadedPath: '' });
    const profileImagePath =
        profileImageUpload.uploadedPath ||
        profile?.profileImagePath ||
        profile?.profileImage ||
        '';
    const profileImage = imageSrcHandler(profileImagePath);
    const { data: bankDetailsData, refetch: fetchBankDetails } = useGetOwnerBankAccountDetailsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const [sendEmailOtp, { isLoading: isSendingEmailOtp }] = useSendEmailVerificationOtpMutation();
    const [verifyEmailOtp, { isLoading: isVerifyingEmailOtp }] = useVerifyOwnerEmailOtpMutation();
    const getFileNameFromPath = (path = '') => {
        if (!path) return '';

        const cleanPath = path.split('?')[0];
        const parts = cleanPath.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1] || '';

        try {
            return decodeURIComponent(lastPart);
        } catch {
            return lastPart;
        }
    };

    useEffect(() => {
        const ownerName =
            `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() ||
            profile?.fullName ||
            profile?.name ||
            '';

        setFormValues({
            ownerName,
            email: profile?.email || '',
            phone: profile?.phone || profile?.phoneNumber || '',
            alternatePhone: profile?.alternatePhone || profile?.phoneNumber || '',
        });

        const govIdPath = profile?.govIdPath || profile?.governmentIdPath || profile?.idProofPath || '';
        const businessProofPath = profile?.businessProofPath || profile?.gstCertificatePath || profile?.udyamCertificatePath || '';

        setGovIdUpload({
            uploadedPath: govIdPath,
            fileName: getFileNameFromPath(govIdPath),
        });

        setBusinessProofUpload({
            uploadedPath: businessProofPath,
            fileName: getFileNameFromPath(businessProofPath),
        });

        if (profileStatus?.status === "rejected") {
            setShowRejectionModal(true);
        }

    }, [profile]);

    const onChange = ({ target }) => {
        const { name, value } = target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const ownerInitial = (formValues.ownerName || 'B').trim().charAt(0).toUpperCase();
    const isDataLoading = isLoading || isFetching;

    const defaultGovIdPath =
        govIdUpload.uploadedPath ||
        profile?.govtIdImagePath ||
        profile?.govIdPath ||
        profile?.governmentIdPath ||
        profile?.idProofPath ||
        '';

    const defaultBusinessProofPath =
        businessProofUpload.uploadedPath ||
        profile?.businessProofImagePath ||
        profile?.businessProofPath ||
        profile?.gstCertificatePath ||
        profile?.udyamCertificatePath ||
        '';

    const currentUploadPreview =
        activeUploadType === 'govt_id'
            ? imageSrcHandler(defaultGovIdPath)
            : activeUploadType === 'business_proof'
                ? imageSrcHandler(defaultBusinessProofPath)
                : activeUploadType === 'profile_pic'
                    ? imageSrcHandler(profileImagePath)
                    : '';

    const activeUploadTitle =
        activeUploadType === 'govt_id'
            ? 'Upload Gov. ID'
            : activeUploadType === 'business_proof'
                ? 'Upload Business Proof'
                : activeUploadType === 'profile_pic'
                    ? 'Upload Profile Image'
                    : 'Upload Document';

    const openUploadModal = (type) => setActiveUploadType(type);

    const handleDocumentUpload = async (uploadPayload) => {
        const uploadedPath = uploadPayload?.uploadedPath;
        const fileName = uploadPayload?.fileName || uploadPayload?.file?.name || '';

        if (!uploadedPath) {
            showErrorToast('Missing uploaded document path.');
            return;
        }

        setIsUploadingDoc(true);

        try {
            const isGovIdUpload = activeUploadType === 'govt_id';
            const isBusinessUpload = activeUploadType === 'business_proof';
            const isProfileUpload = activeUploadType === 'profile_pic';

            if (isGovIdUpload) {
                setGovIdUpload({ fileName, uploadedPath });
            }

            if (isBusinessUpload) {
                setBusinessProofUpload({ fileName, uploadedPath });
            }

            if (isProfileUpload) {
                setProfileImageUpload({ fileName, uploadedPath });
            }

            if (isGovIdUpload) {
                showSuccessToast('Gov. ID uploaded successfully.');
            } else if (isBusinessUpload) {
                showSuccessToast('Business proof uploaded successfully.');
            } else if (isProfileUpload) {
                showSuccessToast('Profile image uploaded successfully.');
            } else {
                showSuccessToast('Document uploaded successfully.');
            }

            setActiveUploadType(null);
        } catch {
            showErrorToast('Failed to upload and update document.');
        } finally {
            setIsUploadingDoc(false);
        }
    };

    const saveDetailsHandler = async () => {
        const ownerName = (formValues.ownerName || '').trim();
        const ownerNameParts = ownerName.split(/\s+/).filter(Boolean);
        const [firstName = '', ...lastNameParts] = ownerNameParts;
        const lastName = lastNameParts.join(' ');
        const govIdPath = govIdUpload.uploadedPath || defaultGovIdPath;
        const businessProofPath = businessProofUpload.uploadedPath || defaultBusinessProofPath;
        const currentFirstName = (profile?.firstName || '').trim();
        const currentLastName = (profile?.lastName || '').trim();
        const currentEmail = profile?.email || '';
        const currentAlternatePhone = profile?.alternatePhone || profile?.phoneNumber || '';
        const currentGovIdPath =
            profile?.govtIdImagePath ||
            profile?.govIdPath ||
            profile?.governmentIdPath ||
            profile?.idProofPath ||
            '';
        const currentBusinessProofPath =
            profile?.businessProofImagePath ||
            profile?.businessProofPath ||
            profile?.gstCertificatePath ||
            profile?.udyamCertificatePath ||
            '';
        const currentProfileImagePath = profile?.profileImagePath || profile?.profileImage || '';

        if (!profile?.profileCompletedAt) {
            const missingFields = [];
            if (!firstName) missingFields.push("Owner Name");
            if (!formValues.email) missingFields.push("Email");
            if (!profileImagePath) missingFields.push("Profile Photo");
            if (!govIdPath) missingFields.push("Gov. ID");
            if (!businessProofPath) missingFields.push("Business Proof");

            if (missingFields.length > 0) {
                const message = missingFields.length === 1
                    ? `${missingFields[0]} is required.`
                    : `The following fields are required: ${missingFields.join(", ")}.`;
                showErrorToast(message);
                return;
            }
        }

        const updateFields = {
            firstName: [firstName, currentFirstName, true],
            lastName: [lastName, currentLastName, false],
            email: [formValues.email, currentEmail, true],
            alternatePhone: [formValues.alternatePhone, currentAlternatePhone, true],
            govtIdImagePath: [govIdPath, currentGovIdPath, true],
            businessProofImagePath: [businessProofPath, currentBusinessProofPath, true],
            profileImagePath: [profileImagePath, currentProfileImagePath, true],
        };

        const updatePayload = Object.fromEntries(
            Object.entries(updateFields).filter(([, [nextValue, currentValue, requireTruthy]]) =>
                (requireTruthy ? Boolean(nextValue) : true) && nextValue !== currentValue
            ).map(([key, [nextValue]]) => [key, nextValue])
        );

        if (!Object.keys(updatePayload).length) {
            showErrorToast('No changes detected to update.');
            return;
        }

        const res = await updateProfile(updatePayload)

        if (res?.data) {
            showSuccessToast("Profile updated successfully.");
            fetchProfile();
        } else {
            showErrorToast(res?.error?.data?.message || "Failed to update profile. Please try again.");
        }
    }

    const handleDeleteDocument = () => {
        const type = deleteWarning.type;
        if (type === 'govt_id') {
            setGovIdUpload({ fileName: '', uploadedPath: '' });
        } else if (type === 'business_proof') {
            setBusinessProofUpload({ fileName: '', uploadedPath: '' });
        }
        setDeleteWarning({ isOpen: false, type: null });
        showSuccessToast("Document removed. Please save to apply changes.");
    };

    const isPending = profileStatus?.status === "pending_verification";
    const emailVerificationHandler = () => {
        if (isPending) {
            showErrorToast("Your profile is currently under review. Please wait for the verification process to complete.");
            return;
        }

        sendEmailOtp().unwrap()
            .then(() => {
                showSuccessToast("OTP sent to your email.");
                setIsEmailOtpModalOpen(true);
            })
            .catch(() => {
                showErrorToast("Failed to send OTP. Please try again.");
            });
    }

    const handleEmailOtpResend = async () => {
        try {
            const res = await sendEmailOtp().unwrap();
            showSuccessToast(res?.message || "Verification code resent successfully.");
        } catch {
            showErrorToast("Failed to resend verification code.");
        }
    };

    const handleEmailOtpVerify = async (otp) => {
        try {
            const res = await verifyEmailOtp({ otp }).unwrap();
            if (res?.success === true) {
                setIsEmailOtpModalOpen(false);
                showSuccessToast(res?.message || "Email verified successfully.");
                fetchProfile();
            }
        } catch {
            showErrorToast("Failed to verify email OTP.");
        }
    };

    const handleDeleteProfile = async () => {
        try {
            const res = await deleteOwnerProfile({ "scope": "profile" }).unwrap();
            setConfirmationToken(res?.data?.confirmationToken || res?.confirmationToken || "");
            setIsDeleteModalOpen(false);
            setIsDeleteOtpModalOpen(true);
            showSuccessToast(res?.message || "Verification code sent to your phone.");
        } catch (error) {
            showErrorToast(error?.data?.message || "Failed to initiate profile deletion.");
        }
    };

    const handleDeleteOtpVerify = async (otp) => {
        try {
            const res = await confirmDeleteProfile({ otp, confirmationToken }).unwrap();
            showSuccessToast(res?.message || "Profile deleted successfully.");
            setIsDeleteOtpModalOpen(false);
            window.location.href = "/";
        } catch (error) {
            showErrorToast(error?.data?.message || "Failed to verify OTP.");
        }
    };

    return (
        <section className="w-full pt-15 ">
            <div className="relative mx-auto flex w-full max-w-330 flex-col gap-2 px-4 min-[500px]:flex-row lg:items-start lg:gap-8 lg:px-6">
                <div className="hidden lg:block">
                    <Navbar />
                </div>
                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                    <div className="px-5 pt-3 sm:px-8 sm:pt-6 flex justify-between items-center">
                        <h2 className="text-md font-semibold text-[#6257eb]">Studio Details</h2>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />

                    <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
                        <div className="flex flex-col items-center">
                            <div className="relative flex h-21 w-21 items-center justify-center rounded-full border border-[#ebeaf4] bg-[#fff5f3] shadow-[0_4px_14px_rgba(41,45,83,0.08)]">
                                {profileImage ? (
                                    <img src={profileImage} alt={profile?.firstName} className="h-20 w-22 rounded-full bg-center" />
                                ) : (
                                    <span className="text-base font-semibold">{ownerInitial}</span>
                                )}
                                <span
                                    onClick={() => {
                                        if (profileStatus?.status !== "pending_verification") openUploadModal('profile_pic');
                                    }}
                                    className={`absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full text-white ring-2 ring-white ${profileStatus?.status === "pending_verification" ? "bg-gray-400 cursor-not-allowed" : "bg-[#6d5ef6] cursor-pointer"}`}
                                >
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-1.5h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-8Z" />
                                        <circle cx="12" cy="12.5" r="2.7" />
                                    </svg>
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-[#7a788f]">Studio Logo or Profile Photo</p>
                            <p className={`mt-2 text-[14px] font-semibold capitalize ${{
                                draft: "text-gray-500",
                                pending_verification: "text-yellow-500",
                                verified: "text-green-500",
                                rejected: "text-red-500",
                            }[profileStatus?.status?.toLowerCase()] || "text-[#7a788f]"}`}>{profileStatus?.status === "pending_verification" ? "Pending Verification" : profileStatus?.status}</p>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-medium text-[#4f4d67]">Studio Owner Full Name</label>
                                <div className="flex h-10 items-center gap-2 rounded-full border border-[#e2e2ea] px-4 text-[12px] text-[#5c5972]">
                                    <img src='/images/navbar/profile.png' className='h-4.5 w-4.5' />
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formValues.ownerName}
                                        onChange={onChange}
                                        disabled={isDataLoading || profileStatus?.status === "pending_verification"}
                                        className="w-full bg-transparent text-[12px] text-[#5c5972] outline-none"
                                    />
                                </div>
                            </div>


                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label className="text-[11px] font-medium text-[#4f4d67]">Email</label>
                                    {profile?.emailVerifiedAt ? null : <button type="button" className="text-[10px] font-medium text-[#6d5ef6] cursor-pointer" onClick={() => emailVerificationHandler()} disabled={isSendingEmailOtp || isVerifyingEmailOtp || !formValues.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)}>{isSendingEmailOtp ? 'Sending...' : 'Send Verification Code'}</button>}
                                </div>
                                <div className="flex h-10 items-center gap-2 rounded-full border border-[#e2e2ea] px-4 text-[12px] text-[#5c5972]">
                                    <img src='/images/navbar/email.png' className='h-4.5 w-4.5' />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formValues.email}
                                        onChange={onChange}
                                        disabled={isDataLoading || profileStatus?.status === "pending_verification"}
                                        className="w-full bg-transparent text-[12px] text-[#5c5972] outline-none"
                                    />
                                </div>
                                {formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email) && (
                                    <p className="mt-1 text-[11px] text-red-500">Please enter a valid email address</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 text-[11px] font-medium text-[#4f4d67]">Phone Number</label>
                                <div className="flex h-10 items-center gap-2 rounded-full border border-[#e2e2ea] bg-[#f1f1f5] px-4 text-[12px] text-[#5c5972]">
                                    <img src='/images/navbar/phone.png' className='h-4.5 w-4.5' />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formValues.phone || ''}
                                        onChange={onChange}
                                        disabled={isDataLoading || profileStatus?.status === "pending_verification" || formValues.phone}
                                        className="w-full bg-transparent text-[12px] text-[#5c5972] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 text-[11px] font-medium text-[#4f4d67]">Alternate Phone Number</label>
                                <div className="flex h-10 items-center gap-2 rounded-full border border-[#e2e2ea] px-4 text-[12px] text-[#5c5972]">
                                    <img src='/images/navbar/phone.png' className='h-4.5 w-4.5' />
                                    <input
                                        type="tel"
                                        name="alternatePhone"
                                        value={formValues.alternatePhone}
                                        onChange={onChange}
                                        disabled={isDataLoading || profileStatus?.status === "pending_verification"}
                                        pattern="[0-9]{10}"
                                        placeholder="10 digit number"
                                        maxLength="10"
                                        className="w-full bg-transparent text-[12px] text-[#5c5972] outline-none"
                                    />
                                </div>
                                {formValues.alternatePhone && formValues.alternatePhone.length !== 10 && (
                                    <p className="mt-1 text-[11px] text-red-500">Phone number must be 10 digits</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-medium text-[#4f4d67]">Gov. ID (Aadhar, Pan or Driving License)</label>
                                <div className="space-y-1.5 text-[11px] text-[#78758f]">
                                    {!defaultGovIdPath && <button
                                        type="button"
                                        onClick={() => openUploadModal('govt_id')}
                                        disabled={isPending || Boolean(defaultGovIdPath)}
                                        className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e2ea] bg-[#f7f7fb] transition-all hover:border-[#6d5ef6]/30 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19.9993 26.6665V36.6665M19.9993 26.6665L23.3327 29.9998M19.9993 26.6665L16.666 29.9998" stroke="#7D7F88" strokeWidth="1.49783" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M36.6663 22.255C36.6663 26.16 34.2597 29.51 30.833 30.9333M23.968 13.3783C24.989 13.0238 26.0622 12.8429 27.143 12.8433C28.233 12.8433 29.2813 13.025 30.2597 13.3583M30.2597 13.3583C29.728 8.65667 25.693 5 20.793 5C15.533 5 11.2697 9.21333 11.2697 14.4117C11.2692 15.5282 11.469 16.6357 11.8597 17.6817M30.2597 13.3583C31.7237 13.858 33.0436 14.7076 34.1047 15.8333M11.8597 17.6817C11.4038 17.5935 10.9406 17.5489 10.4763 17.5483C6.53134 17.55 3.33301 20.71 3.33301 24.6083C3.33301 27.7683 5.43467 30.4433 8.33301 31.3433M11.8597 17.6817C12.7817 17.8612 13.6595 18.2202 14.443 18.7383" stroke="#7D7F88" strokeWidth="1.49783" strokeLinecap="round" />
                                        </svg>
                                        <div className="text-center">
                                            <p className="text-[13px] font-semibold text-[#6d5ef6]">Upload Your Document Here</p>
                                        </div>
                                    </button>}
                                    {defaultGovIdPath && (
                                        <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-[#e2e2ea]">
                                            <p className="truncate text-[12px] font-medium text-[#4f4d67] flex-1 mr-2">{govIdUpload.fileName || "Government ID"}</p>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(defaultGovIdPath)}
                                                    className="text-[11px] font-semibold text-[#6d5ef6] hover:underline cursor-pointer"
                                                ><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21.2572 10.9622C21.7314 11.5813 21.7314 12.4187 21.2572 13.0378C19.764 14.9868 16.1818 19 12 19C7.81823 19 4.23598 14.9868 2.74284 13.0378C2.26857 12.4187 2.26856 11.5813 2.74283 10.9622C4.23598 9.01321 7.81823 5 12 5C16.1818 5 19.764 9.01321 21.2572 10.9622Z" stroke="#6d5ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="12" cy="12" r="3" stroke="#6d5ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg></button>
                                                {(!isPending && profileStatus?.status !== "verified") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteWarning({ isOpen: true, type: 'govt_id' })}
                                                        className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                                                    ><svg width="19px" height="19px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z" fill="#FF0000" /></svg></button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-medium text-[#4f4d67]">Business Proof (GST Certificate, Udyam (MSME))</label>
                                <div className="space-y-1.5 text-[11px] text-[#78758f]">
                                    {!defaultBusinessProofPath && <button
                                        type="button"
                                        onClick={() => openUploadModal('business_proof')}
                                        disabled={isPending || Boolean(defaultBusinessProofPath)}
                                        className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e2ea] bg-[#f7f7fb] transition-all hover:border-[#6d5ef6]/30 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19.9993 26.6665V36.6665M19.9993 26.6665L23.3327 29.9998M19.9993 26.6665L16.666 29.9998" stroke="#7D7F88" strokeWidth="1.49783" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M36.6663 22.255C36.6663 26.16 34.2597 29.51 30.833 30.9333M23.968 13.3783C24.989 13.0238 26.0622 12.8429 27.143 12.8433C28.233 12.8433 29.2813 13.025 30.2597 13.3583M30.2597 13.3583C29.728 8.65667 25.693 5 20.793 5C15.533 5 11.2697 9.21333 11.2697 14.4117C11.2692 15.5282 11.469 16.6357 11.8597 17.6817M30.2597 13.3583C31.7237 13.858 33.0436 14.7076 34.1047 15.8333M11.8597 17.6817C11.4038 17.5935 10.9406 17.5489 10.4763 17.5483C6.53134 17.55 3.33301 20.71 3.33301 24.6083C3.33301 27.7683 5.43467 30.4433 8.33301 31.3433M11.8597 17.6817C12.7817 17.8612 13.6595 18.2202 14.443 18.7383" stroke="#7D7F88" strokeWidth="1.49783" strokeLinecap="round" />
                                        </svg>
                                        <div className="text-center">
                                            <p className="text-[13px] font-semibold text-[#6d5ef6]">Upload Your Document Here</p>
                                        </div>
                                    </button>}
                                    {defaultBusinessProofPath && (
                                        <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-[#e2e2ea]">
                                            <p className="truncate text-[12px] font-medium text-[#4f4d67] flex-1 mr-2">{businessProofUpload.fileName || "Business Proof"}</p>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(defaultBusinessProofPath)}
                                                    className="text-[11px] font-semibold text-[#6d5ef6] hover:underline cursor-pointer"
                                                ><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21.2572 10.9622C21.7314 11.5813 21.7314 12.4187 21.2572 13.0378C19.764 14.9868 16.1818 19 12 19C7.81823 19 4.23598 14.9868 2.74284 13.0378C2.26857 12.4187 2.26856 11.5813 2.74283 10.9622C4.23598 9.01321 7.81823 5 12 5C16.1818 5 19.764 9.01321 21.2572 10.9622Z" stroke="#6d5ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="12" cy="12" r="3" stroke="#6d5ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg></button>
                                                {(!isPending && profileStatus?.status !== "verified") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteWarning({ isOpen: true, type: 'business_proof' })}
                                                        className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                                                    ><svg width="19px" height="19px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z" fill="#FF0000" /></svg></button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="border-t border-[#ecebf3] px-5 py-4 sm:px-8 "
                        onClick={() => setShowBankAccountModal(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                setShowBankAccountModal(true);
                            }
                        }}
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="text-[14px] font-semibold text-[#6257eb]">🏦 Bank Account Details</p>
                                <button className='h-9 w-full px-2 max-w-42 mt-2 rounded-full bg-linear-to-r from-[#1C1C1C] to-[#505050] font-medium text-[12px] text-white shadow-[0_10px_24px_rgba(88,78,236,0.35)] cursor-pointer'>
                                    View & Update Bank Details
                                </button>
                            </div>

                            <p className="pt-1 text-[11px] text-[#7c7a90]">
                                Your bank details are required to process payouts securely.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-[#ecebf3] px-5 py-5 sm:px-8">
                        <div className="flex flex-col-reverse md:flex-row gap-4 items-center md:justify-between">
                            <button
                                type="button"
                                className={`text-[13px] text-[#7c7a90] underline hover:text-red-500 underline-offset-2 ${profileStatus?.status === "pending_verification" ? "cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={profileStatus?.status === "pending_verification"}
                            >
                                Delete Profile
                            </button>
                            <button
                                type="button"
                                className={`h-11 w-full max-w-40 rounded-full bg-linear-to-r from-[#2443b6] to-[#6d5ef6] text-sm font-medium text-white shadow-[0_10px_24px_rgba(88,78,236,0.35)] bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0] ${profileStatus?.status === "pending_verification" ? "cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => saveDetailsHandler()}
                                disabled={profileStatus?.status === "pending_verification"}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </section>
            </div >

            <div className="px-0 sm:px-0 max-w-full mx-auto mt-7">
                <Footer />
            </div>

            <ImageUploadModal
                isOpen={Boolean(activeUploadType)}
                onClose={() => setActiveUploadType(null)}
                onUpload={handleDocumentUpload}
                isUploading={isUploadingDoc}
                currentImage={currentUploadPreview}
                title={activeUploadTitle}
                category={activeUploadType}
            />

            <AddBankAccountDetailsModal
                isOpen={showBankAccountModal}
                bankDetailsData={bankDetailsData}
                fetchBankDetails={fetchBankDetails}
                onClose={() => setShowBankAccountModal(false)}
            />

            {previewImage && (
                <div
                    className="fixed inset-0 z-999 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white p-2">
                        <button
                            className="absolute right-2 top-2 z-10 flex h-8 w-8 justify-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70 cursor-pointer"
                            onClick={() => setPreviewImage(null)}
                        >×</button>
                        <img src={imageSrcHandler(previewImage)} alt="Document Preview" className="max-h-[85vh] w-auto object-contain" />
                    </div>
                </div>
            )}

            <WarningModal
                isOpen={deleteWarning.isOpen}
                onClose={() => setDeleteWarning({ isOpen: false, type: null })}
                onConfirm={handleDeleteDocument}
                title="Remove Document"
                message="Are you sure you want to remove this document? You will need to upload a new one before saving."
                confirmText="Yes, Remove"
                cancelText="No, Cancel"
            />

            <WarningModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProfile}
                title="Delete Host Profile"
                message="Are you really want to delete the account?"
                confirmText={isDeleting ? "Deleting..." : "Confirm Delete"}
                cancelText="Cancel"
            />

            {showRejectionModal && <RejectedModal studio={profileStatus} setShowRejectionModal={setShowRejectionModal} />}

            <OtpVerificationModal
                isOpen={isEmailOtpModalOpen}
                targetValue={formValues.email}
                targetPrefix=""
                isBusy={isSendingEmailOtp || isVerifyingEmailOtp}
                instructionText="Enter Verification Code"
                sentToText="We've sent a verification code to"
                onClose={() => setIsEmailOtpModalOpen(false)}
                onVerify={handleEmailOtpVerify}
                onResend={handleEmailOtpResend}
            />

            <OtpVerificationModal
                isOpen={isDeleteOtpModalOpen}
                targetValue={formValues.phone}
                targetPrefix="+91"
                isBusy={isConfirmingDelete}
                instructionText="Enter Verification Code for account deletion"
                sentToText="We've sent a verification code to"
                onClose={() => setIsDeleteOtpModalOpen(false)}
                onVerify={handleDeleteOtpVerify}
                onResend={handleDeleteProfile}
            />
        </section >

    )
}

export default HostDetails
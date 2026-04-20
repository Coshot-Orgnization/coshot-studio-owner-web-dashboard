"use client";

import React, { useEffect, useState } from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";
import { useAddBankAccountMutation, useUpdateOwnerBankAccountDetailsMutation } from "@/redux/bank-accounts/bankAccountsApi";

const defaultFormValues = {
    upiId: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "SAVINGS",
    isPrimary: true,
    panNumber: "",
    gstNumber: "",
};

const AddBankAccountDetailsModal = ({ isOpen, bankDetailsData, fetchBankDetails, onClose }) => {
    useBodyScrollLock(isOpen);
    const [submitDetails] = useAddBankAccountMutation();
    const [updateDetails] = useUpdateOwnerBankAccountDetailsMutation();
    const currentBankAccountDetails = bankDetailsData?.data;
    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});

    const bankAcoountDetailsArray = [
        { key: "upiId", label: "UPI ID", image: "/images/hostDashboard/upi.png", isOptional: false },
        { key: "accountHolderName", label: "Account Holder Name", image: "/images/hostDashboard/accountHolderName.png", isOptional: false },
        { key: "bankName", label: "Bank Name", image: "/images/hostDashboard/bankName.png", isOptional: false },
        { key: "accountNumber", label: "Account Number", image: "/images/hostDashboard/accountNumber.png", isOptional: false },
        { key: "ifscCode", label: "IFSC Code", image: "/images/hostDashboard/ifsc.png", isOptional: false },
    ]

    const [formValues, setFormValues] = useState(defaultFormValues);

    const validateField = (name, value, allValues = formValues) => {
        const trimmedValue = typeof value === "string" ? value.trim() : value;

        switch (name) {
            case "upiId":
                if (!trimmedValue) return "UPI ID is required";
                if (!/^[\w.-]+@[\w]+$/.test(trimmedValue)) return "Invalid UPI ID";
                return "";
            case "accountHolderName":
                if (!trimmedValue) return "Account holder name is required";
                return "";
            case "bankName":
                if (!trimmedValue) return "Bank name is required";
                return "";
            case "accountNumber":
                if (!trimmedValue) return "Account number is required";
                if (!/^\d{9,18}$/.test(trimmedValue)) return "Invalid account number";
                return "";
            case "ifscCode":
                if (!trimmedValue) return "IFSC code is required";
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(trimmedValue).toUpperCase())) return "Invalid IFSC code";
                return "";
            case "accountType":
                if (!allValues?.accountType) return "Account type is required";
                return "";
            case "panNumber":
                if (trimmedValue && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(trimmedValue).toUpperCase())) return "Invalid PAN number";
                return "";
            case "gstNumber":
                if (trimmedValue && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(String(trimmedValue).toUpperCase())) return "Invalid GST number";
                return "";
            default:
                return "";
        }
    };

    const validateAllFields = (values = formValues) => {
        const fieldsToValidate = [
            "upiId",
            "accountHolderName",
            "bankName",
            "accountNumber",
            "ifscCode",
            "accountType",
            "panNumber",
            "gstNumber",
        ];

        const nextErrors = {};
        fieldsToValidate.forEach((field) => {
            const message = validateField(field, values[field], values);
            if (message) {
                nextErrors[field] = message;
            }
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    useEffect(() => {
        if (!isOpen) {
            setFormValues(defaultFormValues);
            setErrors({});
            setTouchedFields({});
            return;
        }

        if (currentBankAccountDetails) {
            setFormValues({
                ...defaultFormValues,
                upiId: currentBankAccountDetails?.upiId || "",
                accountHolderName: currentBankAccountDetails?.accountHolderName || "",
                bankName: currentBankAccountDetails?.bankName || "",
                accountNumber: currentBankAccountDetails?.accountNumber || "",
                ifscCode: currentBankAccountDetails?.ifscCode || "",
                accountType: currentBankAccountDetails?.accountType || "SAVINGS",
                isPrimary: currentBankAccountDetails?.isPrimary ?? true,
                panNumber: currentBankAccountDetails?.panNumber || "",
                gstNumber: currentBankAccountDetails?.gstNumber || "",
            });
        }
    }, [isOpen, bankDetailsData]);

    const onChange = ({ target }) => {
        const { name, value, type, checked } = target;
        const nextValue = type === "checkbox" ? checked : value;

        setFormValues((prev) => {
            const updatedValues = {
                ...prev,
                [name]: nextValue,
            };

            if (touchedFields[name]) {
                const message = validateField(name, nextValue, updatedValues);
                setErrors((prevErrors) => {
                    const updatedErrors = { ...prevErrors };
                    if (message) {
                        updatedErrors[name] = message;
                    } else {
                        delete updatedErrors[name];
                    }
                    return updatedErrors;
                });
            }

            return updatedValues;
        });
    };

    const onBlur = ({ target }) => {
        const { name, value } = target;
        setTouchedFields((prev) => ({ ...prev, [name]: true }));

        const message = validateField(name, value, formValues);
        setErrors((prevErrors) => {
            const updatedErrors = { ...prevErrors };
            if (message) {
                updatedErrors[name] = message;
            } else {
                delete updatedErrors[name];
            }
            return updatedErrors;
        });
    };

    const handleClose = () => {
        onClose?.();
    };

    const handleSave = async () => {
        const allTouched = {
            upiId: true,
            accountHolderName: true,
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            accountType: true,
            panNumber: true,
            gstNumber: true,
        };
        setTouchedFields(allTouched);

        if (!validateAllFields(formValues)) {
            return;
        }

        let payload = {};

        if (currentBankAccountDetails) {
            // For updates, only send changed fields
            Object.keys(formValues).forEach((key) => {
                if (formValues[key] !== currentBankAccountDetails[key]) {
                    const value = formValues[key];
                    // Only include if it's not an empty string for optional fields
                    if (typeof value !== 'string' || value.trim() !== "" || !["panNumber", "gstNumber"].includes(key)) {
                        payload[key] = value;
                    }
                }
            });

            if (Object.keys(payload).length === 0) {
                showErrorToast("No changes detected.");
                return;
            }
            payload.id = currentBankAccountDetails.id;
        } else {
            // For new entries, send all required fields
            payload = { ...formValues };
            if (!payload.panNumber?.trim()) delete payload.panNumber;
            if (!payload.gstNumber?.trim()) delete payload.gstNumber;
        }

        try {
            const res = await (currentBankAccountDetails
                ? updateDetails(payload)
                : submitDetails(payload)
            ).unwrap();

            fetchBankDetails();
            showSuccessToast("Bank account details submitted successfully.");
            handleClose();
        } catch (error) {
            showErrorToast(
                error?.data?.message ||
                error?.error ||
                "Failed to submit bank account details."
            );
        }

    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
            <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-0 text-2xl text-[#8E8EAA] transition hover:text-[#69699A]"
                    aria-label="Close bank account details modal"
                >
                    ×
                </button>

                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2 items-center">
                        <img src="/images/hostDashboard/bank.png" className="h-5 w-5" />
                        <h3 className="text-xl font-semibold text-[#1B1B2F]">Bank Account Details</h3>
                    </div>
                    <p className="text-sm text-[#6d6b84]">
                        Your bank details are required to process payouts securely.
                    </p>
                </div>

                <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
                    {bankAcoountDetailsArray?.map((item, index) => (
                        <div key={index}>
                            <label className="mb-1 text-[12px] font-medium text-[#4f4d67]">{item.label}</label>
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    name={item.key}
                                    value={formValues[item.key] || ""}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    placeholder={item?.label}
                                    className="h-11 w-full rounded-full shadow-lg border mt-1 border-[#e2e2ea] pl-12 pr-10 text-[12px] font-medium text-[#5c5972] outline-none"
                                />
                                <img src={`${item.image}`} className="absolute left-4 h-6 w-6" />
                            </div>
                            {errors[item.key] ? (
                                <p className="mt-1 ml-2 text-xs text-red-500">{errors[item.key]}</p>
                            ) : null}
                        </div>
                    ))}
                    <div className="flex items-center gap-4">
                        <label className=" block text-[12px] font-medium text-[#4f4d67]">Account Type</label>
                        <div className="flex items-center gap-6 h-11">
                            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#5c5972]">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="SAVINGS"
                                    checked={formValues.accountType === "SAVINGS"}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    className="h-4 w-4 accent-[#6d5ef6]"
                                />
                                Savings
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#5c5972]">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="CURRENT"
                                    checked={formValues.accountType === "CURRENT"}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    className="h-4 w-4 accent-[#6d5ef6]"
                                />
                                Current
                            </label>
                        </div>
                    </div>
                    {errors.accountType ? (
                        <p className="-mt-2 ml-2 text-xs text-red-500">{errors.accountType}</p>
                    ) : null}
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-[#4f4d67]">PAN number (Optional)</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                name="panNumber"
                                value={formValues.panNumber || ""}
                                onChange={onChange}
                                onBlur={onBlur}
                                placeholder="PAN number"
                                className="h-11 w-full rounded-full shadow-lg border mt-1 border-[#e2e2ea] pl-12 pr-10 text-[12px] font-medium text-[#5c5972] outline-none"
                            />
                            <img src="/images/hostDashboard/pn.png" className="absolute left-4 h-6 w-6" />
                        </div>
                        {errors.panNumber ? (
                            <p className="mt-1 ml-2 text-xs text-red-500">{errors.panNumber}</p>
                        ) : null}
                        <p className="text-sm italic text-gray-400 mt-2 ml-2">(for tax & compliance)</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-[#4f4d67]">GST number (Optional)</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                name="gstNumber"
                                value={formValues.gstNumber || ""}
                                onChange={onChange}
                                onBlur={onBlur}
                                placeholder="GST number"
                                className="h-11 w-full rounded-full shadow-lg border border-[#e2e2ea] mt-1 pl-12 pr-10 text-[12px] font-medium text-[#5c5972] outline-none"
                            />
                            <img src="/images/hostDashboard/gst.png" className="absolute left-4 h-6 w-6" />
                        </div>
                        {errors.gstNumber ? (
                            <p className="mt-1 ml-2 text-xs text-red-500">{errors.gstNumber}</p>
                        ) : null}
                        <p className="text-sm italic text-gray-400 mt-2 ml-2">(only if registered)</p>
                    </div>
                </div>

                <div className="mt-6 gap-1 grid justify-center">

                    <button
                        type="button"
                        onClick={handleSave}
                        className="h-11 w-full rounded-full bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(88,78,236,0.35)] hover:opacity-95 sm:w-44 cursor-pointer"
                    >
                        Submit
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="h-11 w-full rounded-full text-sm font-medium text-[#4f4f68] cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBankAccountDetailsModal;
import { toast } from "react-toastify";

const toastDefaults = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
};

const mergeOptions = (options = {}) => ({
    ...toastDefaults,
    ...options,
});

export const showSuccessToast = (message, options) =>
    toast.success(message, mergeOptions(options));

export const showErrorToast = (message, options) =>
    toast.error(message, mergeOptions(options));

export const showInfoToast = (message, options) =>
    toast.info(message, mergeOptions(options));

export const showWarningToast = (message, options) =>
    toast.warning(message, mergeOptions(options));

export const showDefaultToast = (message, options) =>
    toast(message, mergeOptions(options));

export { toast as toastInstance, toastDefaults };
import { useEffect } from "react";

const LOCK_COUNT_ATTRIBUTE = "data-scroll-lock-count";
const PREVIOUS_OVERFLOW_ATTRIBUTE = "data-previous-overflow";

const lockBodyScroll = () => {
    if (typeof document === "undefined") return;

    const body = document.body;
    const activeLocks = Number(body.getAttribute(LOCK_COUNT_ATTRIBUTE) || 0);

    if (activeLocks === 0) {
        body.setAttribute(PREVIOUS_OVERFLOW_ATTRIBUTE, body.style.overflow || "");
        body.style.overflow = "hidden";
    }

    body.setAttribute(LOCK_COUNT_ATTRIBUTE, String(activeLocks + 1));
};

const unlockBodyScroll = () => {
    if (typeof document === "undefined") return;

    const body = document.body;
    const activeLocks = Number(body.getAttribute(LOCK_COUNT_ATTRIBUTE) || 0);
    const nextLocks = Math.max(0, activeLocks - 1);

    if (nextLocks === 0) {
        const previousOverflow = body.getAttribute(PREVIOUS_OVERFLOW_ATTRIBUTE) || "";
        body.style.overflow = previousOverflow;
        body.removeAttribute(PREVIOUS_OVERFLOW_ATTRIBUTE);
        body.removeAttribute(LOCK_COUNT_ATTRIBUTE);
        return;
    }

    body.setAttribute(LOCK_COUNT_ATTRIBUTE, String(nextLocks));
};

const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (!isLocked) return;

        lockBodyScroll();

        return () => {
            unlockBodyScroll();
        };
    }, [isLocked]);
};

export default useBodyScrollLock;
export const formatAmount = (amount, options = {}) => {
    if (amount === null || amount === undefined || amount === "") {
        return "";
    }

    const {
        minimumFractionDigits,
        maximumFractionDigits,
    } = options;

    const parsedAmount = Number(String(amount).replace(/,/g, ""));
    const hasFractionOptions =
        Number.isInteger(minimumFractionDigits) || Number.isInteger(maximumFractionDigits);

    if (hasFractionOptions && Number.isFinite(parsedAmount)) {
        return parsedAmount.toLocaleString("en-IN", {
            minimumFractionDigits,
            maximumFractionDigits,
        });
    }

    const [integerPartRaw, decimalPart] = String(amount).replace(/,/g, "").split(".");
    const isNegative = integerPartRaw.startsWith("-");
    const integerPart = isNegative ? integerPartRaw.slice(1) : integerPartRaw;

    if (!/^\d+$/.test(integerPart)) {
        return String(amount);
    }

    const lastThreeDigits = integerPart.slice(-3);
    const remainingDigits = integerPart.slice(0, -3);
    const formattedInteger = remainingDigits
        ? `${remainingDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThreeDigits}`
        : lastThreeDigits;

    return `${isNegative ? "-" : ""}${formattedInteger}${decimalPart !== undefined ? `.${decimalPart}` : ""}`;
};
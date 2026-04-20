"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";

const roundedInputClass =
    "h-11.5 w-full rounded-full border border-[#dfdde7] bg-white px-5 text-[14px] text-[#5e5b71] shadow-lg outline-hidden placeholder:text-[#b8b5c5]";

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7f7a92]">
        <path
            d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const getAddressComponent = (components = [], type) => {
    const component = components.find((item) => item.types?.includes(type));
    return component?.long_name || "";
};

const GOOGLE_MAPS_LIBRARIES = ["places"];

const AddStudioLocation = () => {
    const router = useRouter();
    const studioId = typeof window !== "undefined" ? localStorage.getItem("studioId") || "" : "";
    const hasPrefilledRef = useRef(false);
    const [createStudio, { isLoading }] = useCreateStudioMutation();
    const autocompleteRef = useRef(null);
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasGoogleMapsApiKey = Boolean(googleMapsApiKey);

    const [searchLocation, setSearchLocation] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [country, setCountry] = useState("");
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const {
        isLoaded: isPlacesReady,
        loadError: placesLoadError,
    } = useJsApiLoader({
        id: "coshot-google-maps-script",
        googleMapsApiKey: googleMapsApiKey || "",
        libraries: GOOGLE_MAPS_LIBRARIES,
        preventGoogleFontsLoading: true,
    });

    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    const placesError = !hasGoogleMapsApiKey
        ? "Google Places API key is missing. You can still enter address manually."
        : placesLoadError
            ? "Google Places could not initialize. Please check API key restrictions (Maps JavaScript API + localhost/domain referrer) or enter address manually."
            : "";

    useEffect(() => {
        if (hasPrefilledRef.current || !studioDetails?.data) return;
        hasPrefilledRef.current = true;

        const location = studioDetails?.data?.location || {};

        queueMicrotask(() => {
            setAddressLine1(location?.addressLine1 || "");
            setAddressLine2(location?.addressLine2 || "");
            setCity(location?.city || "");
            setState(location?.state || "");
            setZipCode(location?.postalCode || location?.zipCode || "");
            setCountry(location?.country || "");

            const displayAddress = location?.displayAddress ||
                [location?.addressLine1, location?.city, location?.state, location?.country]
                    .filter(Boolean)
                    .join(", ");
            setSearchLocation(displayAddress || "");

            const lat = Number(location?.latitude ?? location?.lat ?? studioDetails?.data?.latitude);
            const lng = Number(location?.longitude ?? location?.lng ?? studioDetails?.data?.longitude);

            setLatitude(Number.isFinite(lat) ? lat : null);
            setLongitude(Number.isFinite(lng) ? lng : null);
        });
    }, [studioDetails]);

    const handleAutocompleteLoad = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace?.();
        const components = place?.address_components || [];

        const streetNumber = getAddressComponent(components, "street_number");
        const route = getAddressComponent(components, "route");
        const premise = getAddressComponent(components, "premise") || place?.name || "";
        const subpremise = getAddressComponent(components, "subpremise");

        const sublocalities = components
            .filter(item => item.types?.some(type => type.startsWith("sublocality_level_")))
            .map(item => item.long_name);
        const sublocality = sublocalities.length > 0 ? sublocalities.join(", ") : getAddressComponent(components, "sublocality");


        const primaryLine = [subpremise, premise, streetNumber, route].filter(Boolean).join(", ");
        const formattedAddress = place?.formatted_address || place?.name || "";
        const secondaryLine = [sublocality].filter(Boolean).join(", ");

        setSearchLocation(formattedAddress);
        setAddressLine1(primaryLine || "");
        setAddressLine2(secondaryLine || formattedAddress.split(",")[3] || "");
        setCity(
            getAddressComponent(components, "locality") ||
            getAddressComponent(components, "sublocality") ||
            getAddressComponent(components, "administrative_area_level_2") ||
            ""
        );
        setState(getAddressComponent(components, "administrative_area_level_1"));
        setZipCode(getAddressComponent(components, "postal_code"));
        setCountry(getAddressComponent(components, "country"));

        const location = place?.geometry?.location;
        const lat = typeof location?.lat === "function" ? location.lat() : (location?.lat || null);
        const lng = typeof location?.lng === "function" ? location.lng() : (location?.lng || null);

        setLatitude(lat);
        setLongitude(lng);
    };

    const onContinue = async () => {
        if (!studioId) {
            showErrorToast("Studio ID not found. Please complete previous steps first.");
            return;
        }

        if (!addressLine1.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim()) {
            showErrorToast("Please complete address details before continuing.");
            return;
        }

        const res = await createStudio({
            studioId,
            step: 6,
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            postalCode: zipCode.trim(),
            latitude: typeof latitude === "number" ? latitude : null,
            longitude: typeof longitude === "number" ? longitude : null,
        });

        if (res?.data) {
            showSuccessToast(res?.data?.message || "Location saved successfully.");
            router.push("/add-studio/studio-photos");
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block h-200 w-full rounded-tr-[300px] bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 text-[28px] font-semibold text-[#2f2d3a] lg:mt-15">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-300">
                    <div className="flex justify-between px-6 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-10">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Location</h1>
                            <p className="max-w-90 text-[15px] leading-4 text-[#444356]">
                                Provide your studio location. The full address is visible to guests after booking.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-6 px-6 py-7 md:px-15 md:py-8">
                        <div>
                            <label className="mb-2 block text-[16px] font-medium text-[#464258]">Search Your Location</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                    <SearchIcon />
                                </span>

                                {hasGoogleMapsApiKey && isPlacesReady ? (
                                    <Autocomplete
                                        onLoad={handleAutocompleteLoad}
                                        onPlaceChanged={handlePlaceChanged}
                                        options={{
                                            fields: ["address_components", "formatted_address", "geometry", "name"],
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={searchLocation}
                                            onChange={(event) => setSearchLocation(event.target.value)}
                                            placeholder="Search by Location"
                                            className={`${roundedInputClass} pl-13`}
                                            autoComplete="off"
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        type="text"
                                        value={searchLocation}
                                        onChange={(event) => setSearchLocation(event.target.value)}
                                        placeholder="Search by Location"
                                        className={`${roundedInputClass} pl-13`}
                                        autoComplete="off"
                                    />
                                )}
                            </div>
                            {placesError ? (
                                <p className="mt-2 text-[13px] text-[#b44a4a]">{placesError}</p>
                            ) : (
                                <p className="mt-2 text-[13px] text-[#7a7691]">
                                    {isPlacesReady
                                        ? "Start typing to get Google location suggestions."
                                        : "Loading Google location suggestions..."}
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-3 text-[17px] font-semibold text-[#2f2d3a]">Address</h3>

                            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                                <input
                                    type="text"
                                    value={addressLine1}
                                    onChange={(event) => setAddressLine1(event.target.value)}
                                    placeholder="Address Line 1"
                                    className={roundedInputClass}
                                />

                                <input
                                    type="text"
                                    value={addressLine2}
                                    onChange={(event) => setAddressLine2(event.target.value)}
                                    placeholder="Landmark"
                                    className={roundedInputClass}
                                />
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-4 md:gap-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(event) => setCity(event.target.value)}
                                        placeholder="City"
                                        className={`${roundedInputClass} pr-10`}
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(event) => setState(event.target.value)}
                                        placeholder="State"
                                        className={`${roundedInputClass} pr-10`}
                                    />
                                </div>

                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(event) => setZipCode(event.target.value)}
                                    placeholder="ZipCode"
                                    className={roundedInputClass}
                                />

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(event) => setCountry(event.target.value)}
                                        placeholder="Country"
                                        className={`${roundedInputClass} pr-10`}
                                    />
                                </div>
                            </div>

                            <p className="mt-4 text-[14px] italic text-[#858298]">(Exact address is shared with users only after booking.)</p>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-6 md:px-10 md:py-7">
                        <div className="flex justify-end">
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

export default AddStudioLocation;
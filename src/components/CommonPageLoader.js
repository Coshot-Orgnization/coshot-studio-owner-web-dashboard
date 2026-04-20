import React from "react";

const CommonPageLoader = () => {
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <div className="relative h-100 w-100">
                    <video
                        src="/images/loader.mp4"
                        autoPlay
                        loop
                        muted
                        className="h-full w-full object-cover rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default CommonPageLoader;
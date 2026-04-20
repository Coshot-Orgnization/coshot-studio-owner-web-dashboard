import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white border-b border-gray-200 shadow-sm">
            <div className="h-full flex items-center justify-center px-4">
                <Link href="/" className="inline-flex items-center" aria-label="Go to homepage">
                    <Image
                        src="/images/Logo.png"
                        alt="Coshot"
                        width={190}
                        height={110}
                        priority
                    />
                </Link>
            </div>
        </header>
    );
};


export default Header
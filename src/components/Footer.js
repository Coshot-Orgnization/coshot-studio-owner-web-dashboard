"use client";

import Image from 'next/image';
import { otherFooterLinks, quickLinks } from '@/lists/footerData';
import { usePathname } from 'next/navigation';
import React from 'react';

const Footer = () => {
    const pathname = usePathname();

    const restrictedPage = ["/dashboard"];

    return (
        <footer className="rounded-3x text-white relative">
            {restrictedPage.includes(pathname) && (
                <section className="appPromoSection relative z-2 sm:z-9 top-0 right-0 md:right-10 xl:right-0 xl:top-40">
                    <div className="appPromoHero">
                        <div className="appPromoCard flex mt-10">
                            <div>
                                <p className="appPromoTitle">Explore More with the CoShot App</p>
                                <p className="appPromoDescription">
                                    Download the app to browse studios, manage bookings, list your space, and discover opportunities tailored for creators and studio owners.
                                </p>
                            </div>
                            <Image
                                src='/images/landingPage/mobileF.png'
                                className='h-100 w-108 lg:h-120.5 lg:w-125 xl:h-120.5 xl:w-125 2xl:h-140.5 2xl:w-145 relative z-9 -top-32 lg:-top-55 2xl:-top-73.5 left-8 customMobileImage'
                                alt='Footer Mobiles'
                                width={500}
                                height={600}
                            />
                        </div>
                        <div className='mt-20 ml-10 sm:ml-15 hidden customMobileFooterImage'>
                            <Image
                                src='/images/landingPage/mobileF.png'
                                className='h-60 w-100 md:h-110 md:w-108 '
                                alt='Footer Mobiles'
                                width={400}
                                height={440}
                            />
                        </div>

                        <div className='appPromoStores mb-5 lg:mb-0'>
                            <Image
                                src='/images/landingPage/googlePlay.png'
                                className='appStoreButton cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95'
                                alt='Google Play'
                                width={135}
                                height={40}
                            />
                            <Image
                                src='/images/landingPage/appStore.png'
                                className='appStoreButton cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95'
                                alt='App Store'
                                width={135}
                                height={40}
                            />
                        </div>
                    </div>
                </section>
            )}

            <div className={`footerBaseBg pt-6 lg:py-10 flex flex-col sm:flex-row justify-evenly items-center  mt-0 ${restrictedPage.includes(pathname) ? "sm:-mt-40 relative z-8 h-64 lg:h-[23.1rem] sm:items-end" : "h-80 sm:items-center"} px-4 sm:px-0 gap-6 sm:gap-0`}>
                <div className="text-center sm:text-left">
                    <Image
                        src='/images/CoshotLogoWhite.png'
                        className='w-40 sm:w-71.5 mx-auto sm:mx-0 h-auto'
                        alt='footer'
                        width={286}
                        height={100}
                    />
                    <p className='w-full sm:w-110 sm:ml-6 mt-3 sm:mt-5 text-[13px] sm:text-[18px]' style={{ fontWeight: "400" }}>CoShot is a creative marketplace that connects studios, creators, and brands through seamless booking and collaboration.</p>
                    <div className='flex ml-0 sm:ml-4 mt-3 sm:mt-5 justify-center sm:justify-start'>
                        {quickLinks.map((link) => (
                            <Image
                                key={link.alt}
                                src={`/images/footer/${link.image}`}
                                className='h-8 w-8 sm:h-10 sm:w-10 m-1 sm:m-2 cursor-pointer transition-all duration-200 hover:scale-105'
                                alt={link.alt}
                                width={40}
                                height={40}
                                onClick={() => window.open(link.link, '_blank')}
                            />
                        ))}
                    </div>
                </div>
                <div className='grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-2 sm:gap-y-3'>
                    {otherFooterLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.link}
                            className={`text-[14px] sm:text-[18px] font-medium transition-all duration-200 hover:text-white hover:translate-x-1 text-[#344B82] ${pathname === link.link ? "text-white" : ""}`} style={{ fontWeight: "500" }}
                        >{link.name}</a>
                    ))}
                </div>
            </div>
            <div className="border-[#26355B] border border-dashed bg-[#10172A]" />
            <div className="bg-[#10172A] py-3 text-center text-xs sm:text-sm text-[#344B82] relative z-10">
                © 2026 <span className='text-white'>CoShot</span> . Built with Purpose.
            </div>
        </footer >
    );
};

export default Footer;
"use client";
import React from 'react'
import Navbar from './Navbar'
import { useLogOutMutation } from '@/redux/auth/authApi';
import Footer from './Footer';

const HelpAndSupport = () => {
    const [logOut] = useLogOutMutation();
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f5f5fa] pt-2 lg:pt-12">
            <div className="relative mx-auto flex w-full max-w-330 flex-col gap-2 px-4 min-[500px]:flex-row lg:items-start lg:gap-8 lg:px-6">
                <div className="hidden lg:block">
                    <Navbar onLogout={logOut} />
                </div>
                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:w-221">
                    <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6 md:px-10 md:pb-10 md:pt-7">
                        <div className="flex justify-between">
                            <div className="grid lg:flex justify-between w-full">
                                <h2 className="text-lg font-semibold text-[#6257eb]">Help & Support</h2>
                            </div>
                            <div className="block lg:hidden">
                                <Navbar onLogout={logOut} />
                            </div>
                        </div>
                        <div className="mt-1 lg:mt-5 border-t border-dashed border-[#e3e2ec]" />
                        <p className="text-[15px] font-semibold text-[#6257eb] mt-4 sm:mt-2 sm:ml-10">Contact Support</p>
                        <p className="text-[12px] font-medium text-[#313131] mt-1 sm:ml-10">If you have questions regarding bookings, payments, account issues, or studio listings, feel free to reach out to our support team.</p>
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-15 sm:ml-10">
                            <div className='flex items-center h-14 w-full lg:w-90 gap-3 mt-4 rounded-lg bg-linear-to-r from-[#F2F2F2] to-[#FFFFFF] px-4'>
                                <img src='/images/navbar/mail.png' className="w-8 h-8" />
                                <div className='flex flex-col justify-between'>
                                    <p className="text-[12px] font-semibold text-[#203A8C] mb-0.5">Email Support</p>
                                    <a href="mailto:support@coshot.in" className="text-[12px] font-medium text-[#313131] hover:text-[#6D5EF6] transition-colors">
                                        support@coshot.in
                                    </a>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[#6D5EF6] text-[12px] font-semibold mt-5">Working Hours<br /> <span className="text-[#313131]">Mon – Sat | 10 AM – 6 PM</span></p>
                        <img src="/images/logo.png" alt="Logo" className="mx-auto mt-8 w-35" />
                    </div>
                </section>
            </div>
            <div className="px-0 sm:px-0 max-w-full mx-auto mt-7">
                <Footer />
            </div>
        </div>
    )
}

export default HelpAndSupport
'use client'

import React from 'react';

export default function PolicyDisplay() {
    return (
        <div className="terms-container space-y-10">
            {/* Introduction */}
            <div className='font-normal text-md'>
                <p className="font-ui text-2xl">
                    Welcome to our Community!
                </p>
            </div>

            {/* Important Risk Notice */}
            <div className="bg-[#000000]/5 border-black border-l-4">
                <div className="flex items-start">
                    <div className=" ml-2 p-2">
                        <div className="mt-2 font-ui">
                            <p>
                                Ramicoin.com (“Company”, “we”, “us”, or “our”) respects your privacy. This Privacy Policy explains our approach to data collection and use. By using our website or services, you agree to the collection and use of information in accordance with this policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-10">
                {/* Section 1: Acknowledgement */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">1. No Data Collection
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>We do not collect, store, process, or share any personal information from users of our website, platform, or services:</p>
                        <ol className="list-decimal pl-6 space-y-3">
                            <li className="pl-2">We do not collect names, emails, phone numbers, or identification documents.</li>
                            <li className="pl-2">We do not track wallet addresses beyond what is publicly available on the blockchain.</li>
                            <li className="pl-2">We do not use cookies or tracking technologies for marketing or profiling purposes.</li>
                        </ol>
                    </div>
                </section>


                {/* Section 2: Public Blockchain Data */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">2. Public Blockchain Data
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>When you interact with the Ramicoin ecosystem, your transactions are recorded on public blockchains. These blockchains are open, transparent, and permanent:</p>
                        <ol className="list-decimal pl-6 space-y-3">
                            <li className="pl-2">This information is not created or controlled by us.</li>
                            <li className="pl-2">We cannot edit, delete, or obscure blockchain records.</li>
                        </ol>
                    </div>
                </section>

                {/* Section 3: Third Party Services */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">3. Third-Party Services
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>Our website may link to or integrate third-party services (e.g., wallets, analytics, hosting). We do not control how third parties handle data. Please review their policies before use:</p>
                    </div>
                </section>

                {/* Section 4: Your Responsibility */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">4. Your Responsibility
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <ol className="list-decimal pl-6 space-y-3">
                            <li className="pl-2">Always secure your wallet and private keys.</li>
                            <li className="pl-2">Never share your seed phrase or sensitive information with anyone, including us.</li>
                            <li className='pl-2'>
                                Disconnect your wallet when you are not actively using it.
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Section 5: Changes to this Policy */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">5. Changes to this Policy
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>
                            If we make material changes to this Policy, we will notify you about it on our website. Please keep track of any changes we may make to this Privacy Policy. Your continued access and use of the Services means that you have reviewed all changes to this Privacy Policy as of the date you access and use the Services. Therefore, we encourage you to review this Privacy Policy regularly, as you must comply with it. If for any reason, you are dissatisfied with our privacy practices, you may stop using the Services.
                        </p>
                    </div>
                </section>

                {/* Section 6: Contact us */}
                <section>
                    <div className="mb-4 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">6. Contact us
                        </h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>
                            If you have questions about this Privacy Policy, you can reach us at: <strong>ramicoinbsc@gmail.com</strong>
                        </p>
                    </div>
                </section>

            </div>

            {/* Acceptance Section */}
            <div className="p-3 rounded-sm border border-gray-300 bg-white shadow-sm mt-10">
                <h3 className="text-2xl font-ui font-bold mb-2">Acceptance of Privacy Policy</h3>
                <p className="mb-4">
                    By continuing to use our platform, you acknowledge that you have read, understood, and agree to be bound by these Privacy Policy.
                </p>
            </div>
        </div>
    );
}
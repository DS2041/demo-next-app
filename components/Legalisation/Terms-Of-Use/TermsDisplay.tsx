'use client'

import React from 'react';

export default function TermsDisplay() {
    return (
        <div className="terms-container space-y-4">
            {/* Introduction */}
            <div className='font-normal text-md'>
                <p className="font-ui-body lg:font-ui lg:text-lg ">
                    These Terms of Use are entered into between you, hereinafter referred to as "you" or "your" and Ramicoin.com.
                    By accessing or using any of the products or services provided by Ramicoin.com, you agree and confirm that you
                    have read, understood and accepted all of the terms and conditions stipulated in these Terms.
                </p>
            </div>

            {/* Important Risk Notice */}
            <div className="bg-red-50 border-l-4 border-red-500">
                <div className="flex items-start">
                    <div className=" ml-2 p-2">
                        <h3 className="text-lg font-semibold">Important Risk Notice</h3>
                        <div className="mt-2 text-red-600 font-ui">
                            <p>
                                As with any asset, the value of Digital Currencies may fluctuate significantly and there is a substantial risk of economic losses when purchasing, selling, staking, holding or investing in Digital Currencies and their derivatives.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-10">
                {/* Section 1: Acknowledgement */}
                <section>
                    <div className="mb-6 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">Acknowledgement</h2>
                    </div>
                    <div className="space-y-4 className='font-normal font-ui-body'">
                        <p>By making use of Ramicoin.com Services, you acknowledge, agree and confirm that:</p>
                        <ol className="list-decimal pl-6 space-y-3">
                            <li className="pl-2">As with any asset, the value of Digital Currencies may fluctuate significantly and there is a substantial risk of economic losses when purchasing, selling, staking, holding or investing in Digital Currencies.</li>
                            <li className="pl-2">You shall assume all risks related to Ramicoin.com Services and transactions of digital currencies.</li>
                            <li className="pl-2">Ramicoin.com should not be held liable for any such risks or adverse outcomes.</li>
                            <li className="pl-2">You voluntarily use Ramicoin.com products and services.</li>
                            <li className="pl-2">You understand the mechanism and algorithm of decentralized crypto products, and or exchanges such as Ramicoin.com.</li>
                        </ol>
                        <div className="bg-[#000000]/5 py-4 px-2 border-l-4 border-black mt-4 rounded-r-sm">
                            <p className="text-black italic">
                                By assessing, using or attempting to use Ramicoin.com Services in any capacity, you acknowledge that you accept and agree to be bound by these Terms. If you do not agree, do not access Ramicoin.com or utilize Ramicoin.com Services.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Definitions */}
                <section>
                    <div className="mb-6 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">Definitions</h2>
                    </div>
                    <div className="space-y-5">
                        <dl className="space-y-5">
                            <div className="bg-gray-50 p-3 rounded-sm">
                                <dt className="font-ui font-bold mb-1 text-lg">Ramicoin.com</dt>
                                <dd className="font-ui-body">Refers to an ecosystem consisting of Ramicoin.com website (whose domain names include but are not limited to Ramicoin.com), clients or other applications or services that are developed to offer Ramicoin.com Services.</dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-sm">
                                <dt className="font-ui font-bold mb-1 text-lg">Ramicoin.com Services</dt>
                                <dd className="font-ui-body">Refer to various services provided to you by Ramicoin.com that are based on the Internet and/or blockchain technologies are offered by Ramicoin.com websites. Ramicoin.com Services include but are not limited to such Ramicoin.com ecosystem components as Digital Asset Trading Platform, farming and staking offerings, Ramicoin.com P2P I-Gaming, and I-gaming tournaments competition offerings, as well as affiliate program.</dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-sm">
                                <dt className="font-ui font-bold mb-1 text-lg">Digital Currencies</dt>
                                <dd className="font-ui-body">Refer to encrypted or digital tokens or cryptocurrencies with a certain value that are based on blockchain and cryptography technologies and are issued and managed in a decentralized manner.</dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-sm">
                                <dt className="font-ui font-bold mb-1 text-lg">Crypto-to-crypto Trading</dt>
                                <dd className="font-ui-body">Refers to transactions in which one digital currency is exchanged for another digital currency.</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                {/* Section 3: General Provisions */}
                <section>
                    <div className="mb-6 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold">General Provisions</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">1. Changes to these Terms</h3>
                            <p className="font-ui-body">
                                Ramicoin.com reserves the right to change or amend these Terms at its sole discretion. Ramicoin.com will notify about such changes by updating the terms on its website and modifying the "last revised" date displayed in the header of the document. All the changes to these Terms will become effective upon publication on the website or release to users. Hence, your continued use of Ramicoin.com Services implies your automatic acceptance of the modified Terms.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h3 className="text-lg font-ui font-bold mb-2">2. About Ramicoin.com</h3>
                            <p className="font-ui-body">
                                Although Ramicoin.com has always been committed to maintaining the accuracy of the information provided through Ramicoin.com Services, Ramicoin.com shall not be liable for any loss or damage that may be caused directly or indirectly by your use of these contents. The information Ramicoin.com Services may change without notice, and the main purpose of providing such information is to help users make independent decisions.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h3 className="text-lg font-ui font-bold mb-2">3. Personal Security</h3>
                            <p className="font-ui-body">
                                Ramicoin.com has always been committed to maintaining the security of users, and has implemented industry's best security standards. However, the actions of individual users may pose certain risks. You shall agree to treat your wallet's access credentials (such as seed phrases, private keys and passwords) as confidential information, and not to disclose such information to any third party. You also agree to be solely responsible for taking the necessary precautions to protect your personal information.
                            </p>
                            <p className="font-ui-body mt-3 font-medium">
                                Users are solely responsible for safeguarding their wallet credentials (private keys, seed phrases, passwords). Ramicoin.com does not store such credentials and cannot recover them if lost.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">4. Ramicoin.com Services</h3>
                            <p className="font-ui-body">
                                Ramicoin.com has the right to provide, modify or terminate, at its sole discretion, any Ramicoin.com Services and allow or prohibit some user's use of any Ramicoin.com Services in accordance with relevant platform rules.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">5. Staking Programs</h3>
                            <p className="font-ui-body">
                                Ramicoin.com may, but is not obliged to, provide Staking Programs for specific Digital Currencies to reward, as per certain conditions, users who hold such Digital Currencies in their personal wallets. When making use of such Staking Programs, you should note that:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2">
                                <li>Unless otherwise stipulated by Ramicoin.com, Staking Services are free of charge.</li>
                                <li>Ramicoin.com does not guarantee users' proceeds under any Ramicoin.com/stake Staking Program.</li>
                                <li>Ramicoin.com has the right to initiate or terminate Ramicoin.com/stake Staking Program for any Digital Currencies or modify rules of such programs at its sole discretion.</li>
                                <li>Due to network delay, computer system failures or other force majeure, which may potentially lead to delay of execution of Ramicoin.com/stake Staking Programs.</li>
                                <li>You agree that all investment operation conducted on Ramicoin.com represent your true investment intentions.</li>
                                <li>Ramicoin.com deploys smart contracts for staking services and uses reasonable efforts to ensure their security and functionality.</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">6. Announcements</h3>
                            <p className="font-ui-body">
                                Be aware that all official announcements, news, promotions, competitions and airdrops will be published via Ramicoin.com official website. Users undertake to refer to these materials promptly and on a regular basis. Ramicoin.com will not be held liable or responsible in any manner of compensation should users incur personal losses arising from negligence or ignorance of the announcements.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">7. No Personal And/Or Financial Advice</h3>
                            <p className="font-ui-body">
                                Ramicoin.com is not your advisor, broker, or intermediary, and has no fiduciary relationship or obligation to you in connection with any trades or other activities or decisions affected by you using Ramicoin.com Services. Ramicoin.com does not provide personal advice in relation to our products and services.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-ui font-bold mb-2">8. No Tax, Regulatory or Legal Advice</h3>
                            <p className="font-ui-body">
                                The taxation of Digital Assets is uncertain, and you are responsible for determining what taxes you might be liable to, and how they apply, when transacting through the Ramicoin.com Services.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">9. Market Risks</h3>
                            <p className="text-gray-700">
                                Digital Asset trading, staking, unstaking, claiming is subject to high risk and price volatility. Changes in value may be significant and may occur rapidly and without warning. Past performance is not a reliable indicator of future performance.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">10. Liquidity Risks</h3>
                            <p className="text-gray-700">
                                Digital Assets may have limited liquidity which may make it difficult or impossible for you to sell or exit a position when you wish to do so. This may occur at any time, including at times of rapid price movements.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">11. Fees & Charges</h3>
                            <p className="text-gray-700">
                                Fees and charges are subject to the page display on the day. Ramicoin.com may, at its sole discretion, update the fees & charges from time to time.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">12. Impermanent Loss</h3>
                            <p className="text-gray-700">
                                Please be aware and well educated on the consequences of impermanent loss before adding liquidity to any of the liquidity pools available on Ramicoin.com.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">13. Availability Risks</h3>
                            <p className="text-gray-700">
                                Ramicoin.com does not guarantee that Ramicoin.com Services will be available at any particular time or that Ramicoin.com Services will not be subject to unplanned service outages or network congestion.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">14. Smart Contract Risks</h3>
                            <p className="text-gray-700">
                                You acknowledge that Ramicoin.com Services operate via smart contracts deployed on public blockchains. Smart contracts may contain vulnerabilities, exploits, or bugs beyond the control of Ramicoin.com.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">15. Release of Claims</h3>
                            <p className="text-gray-700">
                                You expressly agree that you assume all risks in connection with your access and use of the services. You further expressly waive and release us from any and all liability, claims, causes of action, or damages arising from or in any way relating to your use of the services.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">16. Indemnity</h3>
                            <p className="text-gray-700">
                                You agree to hold harmless, release, defend, and indemnify Ramicoin.com from and against all claims, damages, obligations, losses, liabilities, costs, and expenses arising from your access and use of the website and services.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">17. No Warranties</h3>
                            <p className="text-gray-700">
                                The services are provided on an "AS IS" and "AS AVAILABLE" basis. To the fullest extent permitted by law, we disclaim any representations and warranties of any kind, whether express, implied, or statutory.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">18. Limitation of Liability</h3>
                            <p className="text-gray-700">
                                Under no circumstances shall we or any of our officers, directors, employees, contractors, agents, affiliates, or subsidiaries be liable to you for any indirect, punitive, incidental, special, consequential, or exemplary damages.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">19. Eligibility</h3>
                            <p className="text-gray-700">
                                To access or use Ramicoin.com, you must be able to form a legally binding contract with us. Accordingly, you represent that you are at least the age of majority in your jurisdiction.
                            </p>
                            <div className="bg-red-50 p-3 rounded-sm mt-3">
                                <p className="text-red-800 font-medium">
                                    Prohibited Localities: Ramicoin.com does not interact with digital wallets and users located in, established in, or a resident of Belarus, Myanmar (Burma), Côte D'Ivoire (Ivory Coast), Cuba, Crimea and Sevastopol, the so-called Donetsk People's Republic, Democratic Republic of Congo, Iran, Iraq, Libya, the so-called Luhansk People's Republic, Mali, Nicaragua, Democratic People's Republic of Korea (North Korea), Russia, Somalia, Sudan, Syria, Yemen, Zimbabwe or any other state, country or region that is included in the Sanction Lists.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">20. Force Majeure</h3>
                            <p className="text-gray-700">
                                Ramicoin.com shall not be liable for any delay, failure, or interruption in performance resulting directly or indirectly from any cause or condition beyond our reasonable control.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Final Provisions */}
                <section>
                    <div className="mb-6 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-ui font-bold mb-2">Final Provisions</h2>
                    </div>
                    <div className="bg-[#000000]/5 p-3 rounded-r-sm border-l-4 border-black mt-4">
                        <p className="text-black text-lg font-ui">
                            You confirm that you are familiar with these Terms and that you fully understand them. Ramicoin.com is not responsible for any risks associated with your use of Ramicoin.com's products and services as well as its website. These Terms are mandatory for everyone using Ramicoin.com's products, services, and its website. By using Ramicoin.com services, you accept these Terms and undertake to comply with them. These Terms are binding on all users, without exception.
                        </p>
                    </div>
                </section>
            </div>

            {/* Acceptance Section */}
            <div className="p-3 rounded-sm border border-gray-300 bg-white shadow-sm mt-10">
                <h3 className="text-2xl font-ui font-bold mb-2">Acceptance of Terms Of Use</h3>
                <p className="mb-4">
                    By continuing to use our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms Of Use.
                </p>
            </div>
        </div>
    );
}
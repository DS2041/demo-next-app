// contexts/FAQContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQCategory {
    category: string;
    questions: FAQItem[];
}

interface FAQContextType {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredFaqs: FAQItem[];
    expandedIndex: number | null;
    setExpandedIndex: (index: number | null) => void;
    hasSearchResults: boolean;
    isSearching: boolean;
}

const FAQContext = createContext<FAQContextType | undefined>(undefined);

export const faqData: FAQCategory[] = [
    {
        category: 'General',
        questions: [
            {
                question: 'What is Ramicoin ?',
                answer: 'Ramicoin is the native token of the ramicoin platform deployed on binance smart chain network : BEP20',
            },
            {
                question: 'Official website domain name ?',
                answer: 'Always check the domain name : ramicoin.com',
            },
            {
                question: 'How to buy Ramicoin ?',
                answer: 'Currently there are two ways to get Ramicoin. Buy From ICO | Refer & Earn.',
            },
            {
                question: 'What is the minimum amount I can invest in ICO ?',
                answer: 'The minimum amount with which you can invest in Ramicoin in ICO is 1 USDT.',
            },
            {
                question: 'What is the ICO price of Ramicoin ?',
                answer: '1 RAMI = 0.005 USDT (ICO price)',
            },
            {
                question: 'What is the business model ?',
                answer: 'At Ramicoin platform we accumulate funds from the ICO to trade Bitcoin and Gold, Whatever profits that are made will be distributed to all the users who have staked their Ramicoins in the "Ramicoin Staking Pool". ',
            },
            {
                question: 'What is the Staking Pool ?',
                answer: 'The Staking Pool is a smart contract that looks after the fair distribution of profits made from trading to all the Ramicoin Stakers.  ',
            },
            {
                question: 'Can I still earn the passive income if my Ramicoins are not staked in the pool ?',
                answer: 'No, you will not be eligible to earn the profits made from trading if you have not staked your Ramicoins in the staking pool.',
            },
            {
                question: 'Is there any locking period to unstake my Ramicoins ?',
                answer: 'Yes, whenever you stake your Ramicoins the tokens will be frozen for next 48 hours.',
            },
            {
                question: 'What is approve transaction ?',
                answer: 'The approve transaction is the smart contract function which asks user for the permission to spend tokens on behalf of them.',
            },
            {
                question: 'Can I earn RamiCoins if I do not have money to invest ?',
                answer: 'Yes, a user can still earn Ramicoins from "The Ramicoin Affiliate Program". Simply go to your /BUY page - generate your referral code and start sharing. Whoever buys the Ramicoin with your code, you earn 10% in Ramicoins of total invested amount.',
            },
        ]
    }
];

export const FAQProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const allQuestions = faqData.flatMap(category => category.questions);
    const filteredFaqs = searchTerm
        ? allQuestions.filter(q =>
            q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : allQuestions;

    const hasSearchResults = filteredFaqs.length > 0;
    const isSearching = searchTerm.length > 0;

    return (
        <FAQContext.Provider value={{
            searchTerm,
            setSearchTerm,
            filteredFaqs,
            expandedIndex,
            setExpandedIndex,
            hasSearchResults,
            isSearching
        }}>
            {children}
        </FAQContext.Provider>
    );
};

export const useFAQ = () => {
    const context = useContext(FAQContext);
    if (context === undefined) {
        throw new Error('useFAQ must be used within a FAQProvider');
    }
    return context;
};
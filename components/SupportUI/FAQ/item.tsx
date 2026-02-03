// components/FAQ/FAQItem.tsx
'use client';

import { useFAQ, FAQItem } from '@/context/faqcontext';
import { Description } from '@/components/page';

interface FAQItemProps {
    faq: FAQItem;
    index: number;
}

export default function FAQItemComponent({ faq, index }: FAQItemProps) {
    const { expandedIndex, setExpandedIndex } = useFAQ();

    const toggleExpand = () => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div
            onClick={toggleExpand}
            className="relative bg-[#ffffff] p-4 rounded-sm transition-all duration-300 flex flex-col justify-start items-start text-left cursor-pointer hover:bg-[#ffffff]"
        >
            <button className="w-full text-lg font-ui text-[#000000] flex flex-col text-left">
                {faq.question}
            </button>
            <Description>
                <p className={`text-left font-normal mt-2 transition-all duration-300 ${expandedIndex === index ? 'block' : 'hidden'}`}>
                    {faq.answer}
                </p>
            </Description>
        </div>
    );
}
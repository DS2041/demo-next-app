// components/FAQ/LeftSideFaq.tsx
'use client';

import { useFAQ } from '@/context/faqcontext';
import FAQItemComponent from './item';

export default function LeftSideFaq() {
    const { filteredFaqs } = useFAQ();

    const mid = Math.ceil(filteredFaqs.length / 2);
    const leftFaqs = filteredFaqs.slice(0, mid);

    return (
        <div className="space-y-1">
            {leftFaqs.map((faq, index) => (
                <FAQItemComponent key={index} faq={faq} index={index} />
            ))}
        </div>
    );
}
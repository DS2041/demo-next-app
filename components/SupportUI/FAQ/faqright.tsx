// components/FAQ/RightSideFaq.tsx
'use client';

import { useFAQ } from '@/context/faqcontext';
import FAQItemComponent from './item';

export default function RightSideFaq() {
  const { filteredFaqs } = useFAQ();
  
  const mid = Math.ceil(filteredFaqs.length / 2);
  const rightFaqs = filteredFaqs.slice(mid);

  // Don't render empty right column
  if (rightFaqs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {rightFaqs.map((faq, index) => (
        <FAQItemComponent key={index} faq={faq} index={index + mid} />
      ))}
    </div>
  );
}
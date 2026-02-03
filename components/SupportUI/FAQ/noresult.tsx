// components/FAQ/NoResults.tsx
'use client';

import { useFAQ } from '@/context/faqcontext';

export default function NoResults() {
  const { searchTerm } = useFAQ();
  
  return (
    <div className="col-span-full py-8 text-center">
      <p className="font-ui text-lg">No results found for "{searchTerm}"</p>
      <p className="text-sm text-gray-600 mt-2">Try different keywords or browse all FAQs</p>
    </div>
  );
}
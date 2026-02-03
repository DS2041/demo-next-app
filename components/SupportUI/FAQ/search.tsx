// components/FAQ/SearchInput.tsx
'use client';

import { useFAQ } from '@/context/faqcontext';
import { Search, X } from 'lucide-react';
import { useRef } from 'react';

export default function SearchBox() {
    const { searchTerm, setSearchTerm } = useFAQ();
    const inputRef = useRef<HTMLInputElement>(null);

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className="relative mb-3 flex justify-start items-center">
            <Search className="absolute left-3 top-4.3 text-[#000000]" size={24} />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search your question"
                className="border-0 no-scrollbar flex gap-7 flex-col justify-center items-center outline-none font-ui w-full placeholder:text-xl text-2xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% pl-11 py-4 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <X
                    className="absolute right-3 top-4.3 text-[#ff0000] cursor-pointer"
                    size={24}
                    onClick={clearSearch}
                />
            )}
        </div>
    );
}
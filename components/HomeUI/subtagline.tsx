"use client";

import { useState, useEffect } from "react";

export function SubTagline() {
    const words = ["trust", "transparency", "decentralization"];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentWord = words[currentWordIndex];
        const typingSpeed = isDeleting ? 70 : 130;

        const timeout = setTimeout(() => {
            if (!isDeleting && displayedText.length < currentWord.length) {
                setDisplayedText(currentWord.slice(0, displayedText.length + 1));
            } else if (isDeleting && displayedText.length > 0) {
                setDisplayedText(currentWord.slice(0, displayedText.length - 1));
            } else if (!isDeleting && displayedText.length === currentWord.length) {
                setTimeout(() => setIsDeleting(true), 1000);
            } else if (isDeleting && displayedText.length === 0) {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }
        }, typingSpeed);

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, currentWordIndex]);

    return (
        <>
            <span className="text-[#000000]/70 font-semibold transition-all duration-300 border-r-2 border-white pr-1 uppercase">
                {displayedText}
            </span>
        </>
    );
}

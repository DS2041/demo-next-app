'use client'

import { useState } from "react";
import BlackSpinner from "../Old/Spinners/BlackSpin";

// Define interface for audit data
interface AuditData {
    date: string;
    profit: number;
    profit_hash: string;
    rami_burn: number;
    burn_hash: string;
    btc_reserve: number;
    treasury_hash: string;
    btc_purchase: number;
    purchase_hash: string;
}

type Color = [number, number, number]

export default function DownloadAudit() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDownload = async () => {
        try {
            setIsLoading(true);
            setIsSuccess(false);

            // Fetch the audit data
            const response = await fetch('/data/audit.json');
            const auditData: AuditData[] = await response.json();

            // Import required libraries dynamically
            const { jsPDF } = await import("jspdf");
            const autoTable = await import('jspdf-autotable');

            // Create PDF document
            const doc = new jsPDF();

            // Set primary colors
            const primaryBlack: Color = [0, 0, 0];
            const cream: Color = [245, 240, 230];
            const lightCream: Color = [250, 247, 242];
            const mediumGray: Color = [100, 100, 100];

            // Calculate how many pages we need
            const entriesPerPage = 18;
            const totalPages = Math.ceil(auditData.length / entriesPerPage);

            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                if (pageNum > 0) {
                    doc.addPage();
                }

                // Add header with black background and white text
                doc.setFillColor(...primaryBlack);
                doc.rect(0, 0, 210, 30, 'F');
                doc.setFontSize(20);
                doc.setTextColor(255, 255, 255);
                // Vertically center the text in the black rectangle
                doc.text('RAMICOIN AUDIT REPORT', 105, 17, { align: 'center' });

                // Add report info with cream background
                doc.setFillColor(...cream);
                doc.rect(14, 38, 182, 15, 'F');

                // Use the same layout for all pages
                doc.setFontSize(13); // Reduced by 20% from 16 to ~13
                doc.setTextColor(...primaryBlack);

                // Vertically center the text in the cream rectangle
                const textY = 46; // Vertically centered in the cream rectangle

                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, textY);

                // Add summary section (only on first page)
                if (pageNum === 0) {
                    doc.setFontSize(16);
                    doc.text('Complete Audit History', 14, 65);
                }

                // Get data for current page
                const startIndex = pageNum * entriesPerPage;
                const endIndex = Math.min(startIndex + entriesPerPage, auditData.length);
                const pageData = auditData.slice(startIndex, endIndex);

                // Prepare table data with proper typing
                const historyData = pageData.map((item: AuditData) => [
                    item.date,
                    `$${item.profit.toLocaleString()}`,
                    `${item.rami_burn.toLocaleString()}`,
                    `${item.btc_purchase.toFixed(8)}`,
                    `${item.btc_reserve.toFixed(8)}`
                ]);

                // Add table to document with custom styling
                autoTable.default(doc, {
                    startY: pageNum === 0 ? 70 : 60,
                    head: [['Date', 'Daily Profit', 'Ramicoin Burn', 'BTC Purchase', 'Bitcoin Reserve']],
                    body: historyData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryBlack,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 11,
                        cellPadding: 3,
                    },
                    bodyStyles: {
                        fontSize: 10,
                        textColor: primaryBlack,
                        cellPadding: 3,
                    },
                    alternateRowStyles: {
                        fillColor: lightCream,
                    },
                    styles: {
                        lineColor: mediumGray,
                        lineWidth: 0.1,
                    },
                    margin: { top: pageNum === 0 ? 70 : 60 },
                    pageBreak: 'avoid'
                });

                // Add footer with cream background
                doc.setFillColor(...cream);
                doc.rect(0, 275, 210, 25, 'F');

                // Add page numbers to footer only
                doc.setFontSize(10);
                doc.setTextColor(...mediumGray);
                doc.text(`Page ${pageNum + 1} of ${totalPages}`, 105, 285, { align: 'center' });
            }

            // Save the PDF
            doc.save('ramicoin-audit.pdf');

            setTimeout(() => {
                setIsLoading(false);   // stop spinner after 3s
                setIsSuccess(true);    // show success
                setTimeout(() => {
                    setIsSuccess(false); // reset after 2s
                }, 2000);
            }, 3000);

        } catch (error) {
            console.error("Error generating PDF:", error);
            setIsLoading(false);
        }
    };

    return (
        <button
                className="mt-4 bg-black px-4 py-2 flex flex-row justify-center items-center gap-2 text-base font-ui font-normal text-white rounded-sm transition duration-200"
                onClick={handleDownload}
                disabled={isLoading || isSuccess}
            >
                {isLoading ? (
                    <>
                        <BlackSpinner />
                        Generating
                    </>
                ) : isSuccess ? (
                    "👍 Success !"
                ) : (
                    "Download Audit"
                )}
            </button>
    );

}

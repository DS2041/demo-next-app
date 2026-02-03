import Link from "next/link";

export default function ContactUsOnTelegram() {

    return (
        <Link
            href="https://t.me/ramicoin_ceo"
            target="_blank"
            className="col-span-1 sm:col-span-8 lg:col-span-4 xl:col-span-4 row-span-1 bg-white py-8 sm:p-12 flex items-center justify-center">
            <button
                className="bg-[#000000]/80 px-4 py-2 flex flex-row items-center gap-2 text-base font-ui font-normal text-white rounded-sm transition duration-200 hover:scale-125 hover:bg-[#000000]"
            >
                Contact Us
            </button>
        </Link>
    );

}

import Button from "@/components/ButtonsUI/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
      {/* Modal wrapper */}
      <div className="relative">
        {/* Close button */}

        <button
          className="
                absolute
                -top-16
                left-1/2 -translate-x-1/2
                flex
                h-10 w-10
                items-center
                justify-center
                rounded-full
                bg-[#ede4de]
                text-lg
                font-bold
                lowercase
                shadow-md
                hover:bg-[#ede4de]
                
              "
        >
          x
        </button>

        {/* Modal */}
        <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
          {/* Header */}
          <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
            <div className="h-14 w-14 shrink-0">
              <Image
                src="/chess/piece/alpha/wN.svg"
                width={56}
                height={56}
                alt="ramicoin"
                className="h-full w-full rounded-sm object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                ramicoin.com
              </span>
              <span className="text-sm opacity-70">esports</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-neutral-700" />

          {/* Order details */}
          <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
            <div>
              <span className="text-xs opacity-70">roomcode:</span>
              <span className="block text-lg">#18</span>
            </div>

            <div className="text-right">
              <span className="text-xs opacity-70">game size:</span>
              <span className="block text-lg">100 RAMI</span>
            </div>
          </div>

          {/* Creator */}
          <div className="px-2 font-ui">
            <span className="text-xs opacity-70">order creator:</span>
            <span className="block break-all text-sm">
              0x0000000000000000000000000dead
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-neutral-700" />
        </div>

        <Button theme="damarnotukdo" className="mt-1 w-full">
          cancel draw request
        </Button>
      </div>
    </div>
  );
}

// import Button from "@/components/ButtonsUI/button";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
//       {/* Modal wrapper */}
//       <div className="relative">
//         {/* Close button */}

//         <button
//           className="
//                 absolute
//                 -top-16
//                 left-1/2 -translate-x-1/2
//                 flex
//                 h-10 w-10
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#ede4de]
//                 text-lg
//                 font-bold
//                 lowercase
//                 shadow-md
//                 hover:bg-[#ede4de]
                
//               "
//         >
//           x
//         </button>

//         {/* Modal */}
//         <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
//           {/* Header */}
//           <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
//             <div className="h-14 w-14 shrink-0">
//               <Image
//                 src="/chess/piece/alpha/wN.svg"
//                 width={56}
//                 height={56}
//                 alt="ramicoin"
//                 className="h-full w-full rounded-sm object-cover"
//               />
//             </div>

//             <div className="flex min-w-0 flex-1 flex-col">
//               <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
//                 ramicoin.com
//               </span>
//               <span className="text-sm opacity-70">esports</span>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />

//           {/* Order details */}
//           <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
//             <div>
//               <span className="text-xs opacity-70">roomcode:</span>
//               <span className="block text-lg">#18</span>
//             </div>

//             <div className="text-right">
//               <span className="text-xs opacity-70">game size:</span>
//               <span className="block text-lg">100 RAMI</span>
//             </div>
//           </div>

//           {/* Creator */}
//           <div className="px-2 font-ui">
//             <span className="text-xs opacity-70">order creator:</span>
//             <span className="block break-all text-sm">
//               0x0000000000000000000000000dead
//             </span>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />
//         </div>

//         <Button theme="tomato" className="mt-1 w-full">
//           decline draw
//         </Button>
//       </div>
//     </div>
//   );
// }

// import Button from "@/components/ButtonsUI/button";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
//       {/* Modal wrapper */}
//       <div className="relative">
//         {/* Close button */}

//         <button
//           className="
//                 absolute
//                 -top-16
//                 left-1/2 -translate-x-1/2
//                 flex
//                 h-10 w-10
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#ede4de]
//                 text-lg
//                 font-bold
//                 lowercase
//                 shadow-md
//                 hover:bg-[#ede4de]
                
//               "
//         >
//           x
//         </button>

//         {/* Modal */}
//         <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
//           {/* Header */}
//           <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
//             <div className="h-14 w-14 shrink-0">
//               <Image
//                 src="/chess/piece/alpha/wN.svg"
//                 width={56}
//                 height={56}
//                 alt="ramicoin"
//                 className="h-full w-full rounded-sm object-cover"
//               />
//             </div>

//             <div className="flex min-w-0 flex-1 flex-col">
//               <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
//                 ramicoin.com
//               </span>
//               <span className="text-sm opacity-70">esports</span>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />

//           {/* Order details */}
//           <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
//             <div>
//               <span className="text-xs opacity-70">roomcode:</span>
//               <span className="block text-lg">#18</span>
//             </div>

//             <div className="text-right">
//               <span className="text-xs opacity-70">game size:</span>
//               <span className="block text-lg">100 RAMI</span>
//             </div>
//           </div>

//           {/* Creator */}
//           <div className="px-2 font-ui">
//             <span className="text-xs opacity-70">order creator:</span>
//             <span className="block break-all text-sm">
//               0x0000000000000000000000000dead
//             </span>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />
//         </div>

//         <Button theme="magenta" className="mt-1 w-full">
//           accept draw
//         </Button>
//       </div>
//     </div>
//   );
// }


// import Button from "@/components/ButtonsUI/button";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
//       {/* Modal wrapper */}
//       <div className="relative">
//         {/* Close button */}

//         <button
//           className="
//                 absolute
//                 -top-16
//                 left-1/2 -translate-x-1/2
//                 flex
//                 h-10 w-10
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#ede4de]
//                 text-lg
//                 font-bold
//                 lowercase
//                 shadow-md
//                 hover:bg-[#ede4de]
                
//               "
//         >
//           x
//         </button>

//         {/* Modal */}
//         <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
//           {/* Header */}
//           <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
//             <div className="h-14 w-14 shrink-0">
//               <Image
//                 src="/chess/piece/alpha/wN.svg"
//                 width={56}
//                 height={56}
//                 alt="ramicoin"
//                 className="h-full w-full rounded-sm object-cover"
//               />
//             </div>

//             <div className="flex min-w-0 flex-1 flex-col">
//               <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
//                 ramicoin.com
//               </span>
//               <span className="text-sm opacity-70">esports</span>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />

//           {/* Order details */}
//           <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
//             <div>
//               <span className="text-xs opacity-70">roomcode:</span>
//               <span className="block text-lg">#18</span>
//             </div>

//             <div className="text-right">
//               <span className="text-xs opacity-70">game size:</span>
//               <span className="block text-lg">100 RAMI</span>
//             </div>
//           </div>

//           {/* Creator */}
//           <div className="px-2 font-ui">
//             <span className="text-xs opacity-70">order creator:</span>
//             <span className="block break-all text-sm">
//               0x0000000000000000000000000dead
//             </span>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-dashed border-neutral-700" />
//         </div>

//         <Button theme="magenta" className="mt-1 w-full">
//           Send Draw Request
//         </Button>
//       </div>
//     </div>
//   );
// }

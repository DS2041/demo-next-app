import { Header, Title, Description, Column } from "@/components/page";
import CryptoSwapPage from "@/components/BuyUI/cryptoswap";
import Image from "next/image";
import ReferCodeUI from "./ReferCode";
import BnbBalance from "../ButtonsUI/bnbBalance";

export default async function BuyPageUI() {
  const unique = "footer";
  return (
    <>
      <Image
        src="/rami/bigbeat.svg"
        width={962}
        height={46}
        className={`col-start-1 col-end-3 row-start-1 max-w-[initial] justify-self-end self-start mt-3 drop-shadow-placed max-2xl:hidden`}
        alt=" "
        aria-hidden="true"
        priority
      />
      <Header>
        <Column className="md:col-span-1">
          <Title>buy crypto</Title>
          <Description>Buy & Sell crypto anytime, anywhere.</Description>
        </Column>
      </Header>
      <article className="grid grid-cols-subgrid col-content pb-18 gap-y-18">
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <CryptoSwapPage unique={unique} />
        </div>
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <ReferCodeUI />
        </div>
      </article>
    </>
  );
}

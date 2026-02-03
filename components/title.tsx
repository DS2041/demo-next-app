import Link from 'next/link'

interface TitleProps {
  children: React.ReactNode;
  link?: string;  // Made optional with ?
  text?: string;  // Made optional with ?
  ariaID: string;
  className?: string;
}

const Title = ({ children, link, text, ariaID, className }: TitleProps) => {
  return (
    <header
      className={`col-start-content-start col-end-content-end flex justify-between items-baseline md:items-center ${className}`}
    >
      <h2
        className="font-display text-fern-1100 text-2xl md:text-5xl font-variation-bold"
        id={ariaID}
      >
        {children}
      </h2>

      {link && (
        <Link
          href={link}
          className="flex gap-1 text-base md:text-xl font-ui transition duration-200 hover:text-dandelion-600"
        >
          {text ? text : 'All posts'}
        </Link>
      )}
    </header>
  )
}

export default Title
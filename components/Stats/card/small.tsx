import { Frontmatter } from './index' // Now we can import it

interface SmallProps {
  frontmatter: Frontmatter;
  className?: string;
}

const Small = ({ frontmatter, className = '' }: SmallProps) => {
  const { id } = frontmatter

  return (
    <div className={`relative flex gap-4 rounded-lg shadow-placed hover:shadow-picked active:shadow-reduced active:scale-[.99375] bg-white active:bg-neutral-01-50 bg-clip-padding transition ease-linear duration-200 overflow-hidden p-8 ${className}`}>
      <div className="flex flex-1 flex-col gap-[.5625rem]">
        <h3
          className="font-display font-variation-bold text-xl leading-xl lowercase m-0 p-0"
          id={`title-${id}`}
        >
        </h3>
      </div>
    </div>
  )
}

export default Small
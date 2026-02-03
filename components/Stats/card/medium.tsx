import Image from 'next/image'
import { Frontmatter } from './index'

function autoParagraph(text: string): string {
  return `<p>${text.split(/\n+/).join('</p><p>')}</p>`
}

// First define MediumImageProps before it's used
interface MediumImageProps {
  image: string;
  title: string | JSX.Element;
}

// Then define the MediumImage component
const MediumImage = ({ image, title }: MediumImageProps) => {
  return (
    <Image
      src={image}
      width={384}
      height={240}
      alt="-"
      className="absolute z-[1] transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 border-0"
    />
  )
}

// Then define MediumProps
interface MediumProps {
  frontmatter: Frontmatter;
  image?: boolean;
  className?: string;
}

const Medium = ({ frontmatter, image, className = '' }: MediumProps) => {
  const { title, summary, id, theme, medium } = frontmatter
  const imageColor = theme ? theme.toString() : '#f1e8e4'

  return (
    <div className={`group/medium isolate relative flex flex-col rounded-lg shadow-placed hover:shadow-picked active:shadow-reduced active:scale-[.99375] bg-white active:bg-neutral-01-50 bg-clip-padding transition ease-linear duration-200 overflow-hidden ${className}`}>
      {image && medium && (
        <div
          className="flex w-full items-center justify-center aspect-[16/9] relative overflow-hidden [mask:radial-gradient(150%_150%_at_50%_25%,_#fff_24.1%,_rgba(255,255,255,0.56)_41.94%,_transparent_48.59%,_transparent_100%)]"
          style={{ backgroundColor: imageColor }}
          aria-labelledby={`title-${id}`}
          tabIndex={0}
        >
          <MediumImage image={medium} title={title} />
        </div>
      )}

      {image && !medium && (
        <div
          className="flex items-center justify-center aspect-[16/9] w-full relative overflow-hidden [mask:radial-gradient(150%_150%_at_50%_25%,_#fff_24.1%,_rgba(255,255,255,0.56)_41.94%,_transparent_48.59%,_transparent_100%)]"
          style={{ backgroundColor: imageColor }}
        />
      )}

      <div className="flex flex-col flex-auto relative z-1 before:transition before:duration-200 before:ease-in before:w-16 before:h-9 before:absolute before:top-7 before:right-0 before:bg-gradient-to-r before:from-white/0 
      before:via-white/10 before:to-white active:before:from-neutral-01-50/0 active:before:via-neutral-01-50/10 active:before:to-neutral-01-50 active:before:via-50% before:z-[3] pb-[1.625rem]">
        <div className="flex flex-col gap-2 px-8 pt-[.8125rem]">
          <h2 className="p-0 m-0 text-3xl leading-none lowercase font-display font-variation-bold" id={`title-${id}`}>
            <span tabIndex={0} className="text-fern-1100 before:content-[''] before:absolute before:inset-0 before:cursor-pointer before:rounded-lg before:z-[1]">
              {title}
            </span>
          </h2>
          {summary && (
            <div
              className="text-ui-body line-clamp-3 break-[none] text-lg hyphens-auto font-body"
              dangerouslySetInnerHTML={{ __html: autoParagraph(summary) }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Medium
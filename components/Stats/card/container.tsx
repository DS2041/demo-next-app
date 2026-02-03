// components/card/container.tsx
import Image from 'next/image'
import Badge from '../badge';
import { BadgeTheme } from "../badge"

function autoParagraph(text: string, size: string): string {
  return `<p className="${size}">${text.split(/\n+/).join('</p><p>')}</p>`
}

interface PostImageProps {
  large?: string;
  medium?: string;
  title: string | JSX.Element;
  year: number;
}

const PostImage = ({ large, medium, title, year }: PostImageProps) => {
  const oldWidthLarge = 738
  const oldHeightLarge = 492

  return (
    <>
      <Image
        src={medium || ''}
        width={384}
        height={240}
        alt="-"
        className="@lg/card:hidden"
        quality={100}
        unoptimized
        priority
      />
      <Image
        src={large || ''}
        width={year > 2020 ? 592 : oldWidthLarge}
        height={year > 2020 ? 368 : oldHeightLarge}
        alt="-"
        aria-hidden={true}
        className="hidden @lg/card:block"
        quality={100}
        unoptimized
        priority
      />
    </>
  )
}

interface ContainerProps {
  frontmatter: {
    title: string | JSX.Element;
    summary?: string;
    id: string;
    theme?: string;
    large?: string;
    medium?: string;
    badgeIcon?: string; // Add this
    categories?: string[]; // Add this
  };
  image?: boolean;
  className?: string;
}

const Container = ({ frontmatter, image, className = 'card' }: ContainerProps) => {
  const {
    title,
    summary,
    id,
    theme,
    large,
    medium,
    badgeIcon = '/rami/logo200.svg',
    categories = []
  } = frontmatter

  // components/card/container.tsx
  const getBadgeTheme = (): BadgeTheme => {
    if (categories.includes('Trading')) return 'rio'
    if (categories.includes('Token')) return 'dandelion'
    if (categories.includes('Hedge Fund')) return 'fern' // Note the capital 'F' to match your data
    if (categories.includes('I-Gaming')) return 'magenta'
    if (categories.includes('DeFi')) return 'grass'
    if (categories.includes('Security')) return 'moss'
    return 'cornflour'
  }

  const imageColor = theme ? theme.toString() : '#f1e8e4'
  const imageClass = 'relative flex items-center justify-center'

  return (
    <article
      className={`cursor-pointer @container/card group/card isolate flex flex-col self-start rounded-lg shadow-placed hover:shadow-picked active:shadow-reduced bg-white active:bg-neutral-01-50 active:scale-[.99375] bg-clip-padding transition duration-200 ease-in overflow-hidden relative h-full ${className}`}
    >
      {image && (large || medium) && (
        <div
          title=""
          className={imageClass}
          style={{ backgroundColor: imageColor }}
          aria-labelledby={`title-${id}`}
        >
          <PostImage
            large={large}
            medium={medium}
            title={title}
            year={2025}
          />
        </div>
      )}

      <div className={`flex flex-col flex-auto relative py-8 @lg/card:pb-[2.625rem] @lg/card:pt-12`}>
        <div className="flex flex-col gap-2.5 px-8 pt-[.8125rem] @lg/card:pt-2 @lg/card:gap-3 @lg/card:px-12">
          <div className='flex justify-start items-center mb-4'>
            <Badge
              theme={getBadgeTheme()}
              iconSrc={badgeIcon}
              iconAlt="-"
            />
          </div>
          <h2
            className="p-0 m-0 leading-none text-balance lowercase font-display font-variation-bold hyphens-auto text-3xl @lg/card:text-5xl"
            id={`title-${id}`}
          >
            <span className="text-fern-1100 before:content-[''] before:absolute before:inset-0 before:cursor-pointer before:rounded-md @lg/card:before:rounded-lg before:z-[1]">
              {title}
            </span>
          </h2>
          {summary && (
            <div
              className="flex-auto md:text-lg text-ui-body line-clamp-4 @lg/card:line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: autoParagraph(summary, 'font-body'),
              }}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default Container
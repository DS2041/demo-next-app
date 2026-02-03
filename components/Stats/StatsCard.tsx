import Title from '@/components/title'
import Card from '@/components/Stats/card'

interface Post {
  _id: string
  title: string | JSX.Element
  summary: string
  categories: string[]
  theme: string
  slug?: string
  medium?: string
  badgeIcon: string;
  id: string; 
}

interface TradingPerformanceDataProps {
  posts: Post[]
  title: string
  linkText: string
  linkHref: string
  accentColor: string
  prefix?: string
}


export default function TradingPerformanceData({
  posts,
  title,
  linkText,
  linkHref,
  accentColor,
  prefix = ''
}: TradingPerformanceDataProps) {
  return (
    <>
      <Title
        link={linkHref}
        text={linkText}
        ariaID={`popular-${title.toLowerCase()}`}
        className="sm:px-4 md:px-8 sm:-mx-4 md:-mx-8 sm:bg-neutral-01-150 sm:bg-[url(/images/texture.png)] sm:bg-[172px_auto] sm:bg-blend-multiply sm:-mt-[1.125rem] md:-mt-[1.375rem]"
      >
        {prefix && `${prefix} `} <span className={accentColor}>{title}</span>
      </Title>
      <div className="grid col-start-margin-start col-end-margin-end sm:col-content gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 px-4 sm:px-0">
        {posts.map((post) => (
          <Card
            size="container"
            frontmatter={post}
            image={false}
            key={post._id}
            className="max-sm:w-[calc(100vw_-_48px)] max-sm:snap-center md:col-span-1"
          />
        ))}
      </div>
    </>
  )
}

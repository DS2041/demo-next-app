// pages/all-products.tsx
import Title from '@/components/title'
import Card from '@/components/card'

interface AllProductsProps {
  posts: Array<{
    title: string;
    summary: string;
    images: {
      small: string;
      medium: string;
      large: string;
    };
    badgeIcon: string;
    categories: string[];
    status: string; // Add this
  }>;
}


export default function AllProducts({ posts }: AllProductsProps) {
  return (
    <>
      <Title
        ariaID="latest"
        className="sm:px-4 md:px-8 sm:-mx-4 md:-mx-8 sm:bg-neutral-01-150 sm:bg-[url(/images/texture.png)] sm:bg-[172px_auto] sm:bg-blend-multiply sm:-mt-[1.125rem] md:-mt-[1.375rem]"
      >
        What do we do?
      </Title>
      <div className="grid col-start-margin-start col-end-margin-end sm:col-content gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 px-4 sm:px-0">
        {posts.map((post, index) => (
          <Card
            key={index}
            size="container"
            frontmatter={{
              title: post.title,
              summary: post.summary,
              small: post.images.small,
              medium: post.images.medium,
              badgeIcon: post.badgeIcon, // Pass the badgeIcon
              categories: post.categories, // Pass the categories
              large: post.images.large,
              status: post.status, // Add this line
              id: index.toString(),
              date: new Date().toISOString()
            }}
            image={true}
            className="w-full"
          />
        ))}
      </div>
    </>
  )
}
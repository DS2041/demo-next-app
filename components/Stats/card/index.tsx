import Container from './container'
import Medium from './medium'
import Small from './small'

interface Frontmatter {
  title: string | JSX.Element;
  summary?: string;
  id: string;
  theme?: string;
  large?: string;
  medium?: string;
  small?: string;
  badgeIcon?: string;
  categories?: string[];
}


interface CardProps {
  size?: 'container' | 'medium' | 'small';
  image?: boolean;
  frontmatter: Frontmatter;
  className?: string;
}

const Card = ({ size = 'container', image, frontmatter, className }: CardProps) => {
  return (
    <>
      {size === 'container' && (
        <Container
          image={image}
          frontmatter={frontmatter}
          className={className}
        />
      )}
      {size === 'medium' && (
        <Medium image={image} frontmatter={frontmatter} className={className} />
      )}
      {size === 'small' && (
        <Small frontmatter={frontmatter} className={className} />
      )}
    </>
  )
}

export default Card
export type { Frontmatter } 
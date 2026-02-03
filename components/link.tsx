import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'

type LinkProps = {
  href: string;
} & Omit<NextLinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

const Link = ({ href, ...props }: LinkProps) => {
  const isInternalLink = href.startsWith('/')
  const isAnchorLink = href.startsWith('#')

  if (isInternalLink) {
    return <NextLink href={href} {...props} />
  }

  if (isAnchorLink) {
    return <a href={href} {...props} />
  }

  return <a rel="noopener noreferrer" href={href} {...props} />
}

export default Link
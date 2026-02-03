import NextLink from 'next/link'
import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'

type ButtonProps = {
  theme?:
    | "dandelion"
    | "rio"
    | "cornflour"
    | "fern"
    | "magenta"
    | "grass"
    | "moss"
    | "lavender"
    | "tomato"
    | "damarnotukdo";
  children?: ReactNode
  className?: string
} & (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: never } & ButtonHTMLAttributes<HTMLButtonElement>)
  )

const Button = (props: ButtonProps) => {
  const styleVariants = {
    dandelion: "button-dandelion",
    rio: "button-rio",
    cornflour: "button-cornflour",
    fern: "button-fern",
    magenta: "button-magenta",
    grass: "button-grass",
    moss: "button-moss",
    lavender: "button-lavender",
    tomato: "button-tomato",
    damarnotukdo: "button-damarnotukdo",
  };
  const base = `select-none font-ui text-base/tight lowercase text-center`
  const style = `${props.theme ? styleVariants[props.theme] : ''} ${props.className || ''}`

  // Extract props that should only go to the underlying element
  const { theme, className, ...restProps } = props

  if (props.href) {
    const isInternalLink = props.href.startsWith('/')
    const isAnchorLink = props.href.startsWith('#')

    if (isInternalLink) {
      return (
        <NextLink
          href={props.href}
          className={`${base} ${style}`.trim()}
          {...restProps as AnchorHTMLAttributes<HTMLAnchorElement>}
        />
      )
    }

    if (isAnchorLink) {
      return (
        <a
          href={props.href}
          className={`${base} ${style}`.trim()}
          {...restProps as AnchorHTMLAttributes<HTMLAnchorElement>}
        />
      )
    }

    return (
      <a
        rel="noopener noreferrer"
        href={props.href}
        className={`${base} ${style}`.trim()}
        {...restProps as AnchorHTMLAttributes<HTMLAnchorElement>}
      />
    )
  }

  return (
    <button
      className={`${base} ${style}`.trim()}
      {...restProps as ButtonHTMLAttributes<HTMLButtonElement>}
    >
      <span>{props.children}</span>
    </button>
  )
}

export default Button

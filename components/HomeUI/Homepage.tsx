import Hero from '@/components/HomeUI/hero'
import Frame from '@/components/Frame/frame'
import AllProducts from '@/components/products/products'
import StatsDataUI from '../Stats/StatsData'

const products = [
  {
    title: 'Global Hedge Fund',
    summary: 'Redefining the asset management on chain with ramicoin at its core.',
    images: {
      small: '/rami/products/h384.png',
      medium: '/rami/products/h384.png',
      large: '/rami/products/h384.png'
    },
    badgeIcon: '/num/one.svg', // Specific badge icon
    categories: ['Global Hedge Fund'],
    status: 'live',
  },
  {
    title: 'I-Gaming',
    summary: 'Monetize your skills, compete and win up to 2x returns.',
    images: {
      small: '/rami/products/8bp.png',
      medium: '/rami/products/8bp.png',
      large: '/rami/products/8bp.png'
    },
    badgeIcon: '/num/two.svg', // Specific badge icon
    categories: ['I-Gaming'],
    status: 'coming soon',
  },
  {
    title: 'DeFi',
    summary: 'Buy and Sell crypto anytime, anywhere, any amount.',
    images: {
      small: '/rami/products/d384.png',
      medium: '/rami/products/d384.png',
      large: '/rami/products/d384.png'
    },
    badgeIcon: '/num/three.svg', // Specific badge icon
    categories: ['DeFi'],
    status: 'coming soon',
  },
  {
    title: 'Security',
    summary: 'Storing your digital assets is our priority.',
    images: {
      small: '/rami/products/sct.png',
      medium: '/rami/products/sct.png',
      large: '/rami/products/sct.png'
    },
    badgeIcon: '/num/four.svg', // Specific badge icon
    categories: ['Security'],
    status: 'coming soon',
  }
]

export default function HomePage() {
  return (
    <>
      {/* <Hero /> */}
      <main className="grid grid-cols-subgrid col-margin gap-y-10 md:gap-y-18 md:pb-18">
        <Frame>
          <AllProducts posts={products} />
        </Frame>
        {/* <StatsDataUI /> */}
      </main>
    </>
  )

}
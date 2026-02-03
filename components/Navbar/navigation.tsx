'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import ConnectWalletButton from '@/components/ButtonsUI/ConnectWallet/ConnectWallet'


const Navigation = () => {

  return (
    <NavigationMenu.Root
      orientation="vertical"
      className="flex nroot">
      <NavigationMenu.List className="flex nlist">
        <NavigationMenu.Item className="flex nitem">
          <ConnectWalletButton />
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport className="nav-viewport px-4 absolute flex justify-center top-full left-0 right-0" />
    </NavigationMenu.Root>
  )
}

export { Navigation }

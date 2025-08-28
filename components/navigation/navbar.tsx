'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  
  return (
    <nav className="border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Polling App</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/polls"
                className={`transition-colors hover:text-foreground/80 ${pathname.startsWith('/polls') ? 'text-foreground' : 'text-foreground/60'}`}
              >
                Polls
              </Link>
              <Link
                href="/polls/create"
                className={`transition-colors hover:text-foreground/80 ${pathname === '/polls/create' ? 'text-foreground' : 'text-foreground/60'}`}
              >
                Create Poll
              </Link>
              <Link
                href="/auth/login"
                className={`transition-colors hover:text-foreground/80 ${pathname.startsWith('/auth') ? 'text-foreground' : 'text-foreground/60'}`}
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </nav>
  )
}
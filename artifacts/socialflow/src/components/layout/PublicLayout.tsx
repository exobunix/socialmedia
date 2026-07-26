import { Link } from "wouter"
import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
              SF
            </div>
            <span className="font-bold text-lg tracking-tight">SocialFlow AI</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
          </nav>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-slate-800" />}
            </button>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Log in</Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

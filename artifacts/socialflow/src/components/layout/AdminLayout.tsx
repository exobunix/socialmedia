import * as React from "react"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { useGetMe, useLogoutUser } from "@workspace/api-client-react"
import { 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  BarChart,
  Command,
  Search,
  ArrowRight
} from "lucide-react"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { data: user, isLoading: isUserLoading, isError } = useGetMe()
  const logout = useLogoutUser()
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false)
  const [paletteSearch, setPaletteSearch] = React.useState("")

  React.useEffect(() => {
    const token = localStorage.getItem("socialflow_auth_token")
    if (!token) {
      window.location.replace("/login")
      return
    }

    if (!isUserLoading) {
      if (isError || !user) {
        window.location.replace("/login")
      } else if (user.role !== "admin") {
        window.location.replace("/dashboard")
      }
    }
  }, [user, isUserLoading, isError])

  // Key listener for Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsPaletteOpen(prev => !prev)
      } else if (e.key === "Escape") {
        setIsPaletteOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isUserLoading || !user || user.role !== "admin") {
    return <div className="h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  const navItems = [
    { label: "Overview", href: "/", icon: BarChart, keywords: "dashboard stats reports charts finance" },
    { label: "Users", href: "/users", icon: Users, keywords: "members customers activity impersonate suspend" },
    { label: "Plans", href: "/plans", icon: CreditCard, keywords: "pricing subscription coupons billing" },
    { label: "Platforms & Integrations", href: "/platforms", icon: Settings, keywords: "oauth secret keys openai gemini deepseek smtp stripe" },
  ]

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("socialflow_auth_token")
        setLocation("/login")
      }
    })
  }

  const filteredPaletteItems = navItems.filter(item =>
    item.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    item.keywords.toLowerCase().includes(paletteSearch.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-xl mb-4 text-primary">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">SF</div>
            <span>Admin Portal</span>
          </div>
          {/* Ctrl+K Indicator */}
          <button 
            onClick={() => setIsPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-background/50 hover:bg-background transition-all text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Search panel...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Ctrl+K Command Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center border-b border-border px-3 py-2.5">
              <Search className="w-4 h-4 mr-2 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Type a command or keyword to search..."
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button 
                onClick={() => setIsPaletteOpen(false)}
                className="text-xs bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground"
              >
                ESC
              </button>
            </div>
            
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
                Admin Commands
              </div>
              {filteredPaletteItems.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No matching commands found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredPaletteItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        setLocation(item.href)
                        setIsPaletteOpen(false)
                        setPaletteSearch("")
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

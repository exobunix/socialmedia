import * as React from "react"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { useGetMe, useListWorkspaces, useLogoutUser } from "@workspace/api-client-react"
import { 
  LayoutDashboard, 
  Share2, 
  PenSquare, 
  Sparkles, 
  ListOrdered, 
  Calendar as CalendarIcon, 
  Image as ImageIcon, 
  BarChart2, 
  CreditCard, 
  Settings, 
  HelpCircle,
  LogOut
} from "lucide-react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { data: user, isLoading: isUserLoading, isError } = useGetMe()
  const { data: workspaces } = useListWorkspaces()
  const logout = useLogoutUser()

  React.useEffect(() => {
    if (!isUserLoading && (isError || !user)) {
      setLocation("/login")
    }
  }, [user, isUserLoading, isError, setLocation])

  if (isUserLoading || !user) return <div className="h-screen bg-background flex items-center justify-center">Loading...</div>

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Social Accounts", href: "/accounts", icon: Share2 },
    { label: "Create Content", href: "/create", icon: PenSquare },
    { label: "AI Studio", href: "/ai/studio", icon: Sparkles },
    { label: "Posts", href: "/posts", icon: ListOrdered },
    { label: "Calendar", href: "/calendar", icon: CalendarIcon },
    { label: "Media Library", href: "/media", icon: ImageIcon },
    { label: "Analytics", href: "/analytics", icon: BarChart2 },
    { label: "Billing", href: "/billing", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
  ]

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("socialflow_auth_token")
        setLocation("/login")
      }
    })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-xl mb-4">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">SF</div>
            <span>SocialFlow AI</span>
          </div>
          
          <div className="mt-4">
            <select className="w-full bg-background border border-border rounded p-2 text-sm">
              {workspaces?.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
              {!workspaces?.length && <option>Personal Workspace</option>}
            </select>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 md:hidden">
          <div className="font-bold">SocialFlow AI</div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

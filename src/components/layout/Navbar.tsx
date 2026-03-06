"use client"

import { LayoutDashboard, Users, ShoppingCart, Truck, Boxes, LogOut, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
  { title: "الرئيسية", icon: LayoutDashboard, path: "/" },
  { title: "المخزن", icon: Boxes, path: "/inventory" },
  { title: "العملاء", icon: Users, path: "/customers" },
  { title: "الموردون", icon: Truck, path: "/suppliers" },
  { title: "الطلبات", icon: ShoppingCart, path: "/orders" },
]

export function Navbar() {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "تم الخروج", description: "نشوفك على خير قريب!" })
      router.push("/login")
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدثت مشكلة أثناء تسجيل الخروج" })
    }
  }

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-primary text-white z-50 px-6 items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold">مدبر الأرباح</span>
        </div>
        
        <div className="flex items-center gap-2">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10",
                pathname === item.path ? "bg-accent text-primary font-bold" : "text-white/80"
              )}
            >
              {item.title}
            </Link>
          ))}
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-red-200 hover:text-red-400 hover:bg-red-500/10 mr-4"
          >
            <LogOut className="h-4 w-4 ml-2" />
            خروج
          </Button>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-primary/10 z-50 flex items-center justify-around px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all",
                isActive ? "text-primary scale-110" : "text-muted-foreground opacity-60"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

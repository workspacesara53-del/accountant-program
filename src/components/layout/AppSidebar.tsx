
"use client"

import { LayoutDashboard, Users, ShoppingCart, Truck, Wallet, Boxes, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/hooks/use-toast"

const menuItems = [
  { title: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { title: "المخزن", icon: Boxes, path: "/inventory" },
  { title: "العملاء", icon: Users, path: "/customers" },
  { title: "الموردون", icon: Truck, path: "/suppliers" },
  { title: "الطلبات", icon: ShoppingCart, path: "/orders" },
]

export function AppSidebar() {
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
    <Sidebar side="right" className="border-r bg-primary text-primary-foreground">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">مدبر الأرباح</h1>
            <p className="text-xs text-primary-foreground/70">المحاسب الذكي</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase text-primary-foreground/50">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.path}
                  className="w-full justify-start gap-4 px-4 py-3 transition-all hover:bg-white/10"
                >
                  <Link href={item.path} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full justify-start gap-4 px-4 py-3 text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

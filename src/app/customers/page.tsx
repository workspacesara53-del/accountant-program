
"use client"

import { useMemo, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { User, ChevronLeft, Loader2, Search, Users, DollarSign, ArrowRight, ShoppingBag } from "lucide-react"
import { Order } from "@/lib/types"

export default function CustomersPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const customersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: orders, isLoading } = useCollection<Order>(customersQuery as any)

  const customers = useMemo(() => {
    if (!orders) return []
    const grouped: Record<string, { name: string, orderCount: number, totalAmount: number, totalPaid: number, totalDue: number }> = {}
    
    orders.forEach(o => {
      // استبعاد "المخزن العام" من قائمة العملاء
      if (o.customerName === "المخزن العام") return

      if (!grouped[o.customerName]) {
        grouped[o.customerName] = { name: o.customerName, orderCount: 0, totalAmount: 0, totalPaid: 0, totalDue: 0 }
      }
      grouped[o.customerName].orderCount += 1
      grouped[o.customerName].totalAmount += (o.salePrice * o.quantityOrdered)
      grouped[o.customerName].totalPaid += (o.customerPaid || 0)
      // مديونية العميل = (سعر البيع * الكمية المسلمة) - ما دفعه العميل
      grouped[o.customerName].totalDue += ((o.salePrice * (o.quantityDelivered || 0)) - (o.customerPaid || 0))
    })

    return Object.values(grouped).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.totalDue - a.totalDue)
  }, [orders, searchTerm])

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <Navbar />
      
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <h2 className="text-sm md:text-lg font-bold text-primary flex items-center gap-2">
          <Users className="h-5 w-5" /> إدارة العملاء
        </h2>
        <div className="bg-primary/10 px-3 py-1 rounded-full text-[10px] font-bold text-primary">
          {customers.length} عملاء
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن عميل..." 
            className="pr-10 h-11 text-sm shadow-sm border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل القائمة...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
            <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground italic text-sm">لا يوجد عملاء حقيقيين مسجلين.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {customers.map((customer) => (
              <Card key={customer.name} className="border-none shadow-sm hover:shadow-md transition-all group border-r-4 border-r-transparent hover:border-r-accent rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">{customer.name}</CardTitle>
                        <CardDescription className="text-[10px]">{customer.orderCount} طلبات</CardDescription>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Link href={`/customers/${encodeURIComponent(customer.name)}`}>
                        <ChevronLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" /> مبيعات مسلمة
                      </p>
                      <p className="text-sm font-bold">{(customer.totalAmount - (customer.totalAmount - (customer.totalPaid + customer.totalDue))).toLocaleString()} ج.م</p>
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3" /> المديونية
                      </p>
                      <p className={`text-sm font-black ${customer.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                        {customer.totalDue.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="link" className="w-full mt-4 h-8 p-0 text-accent text-xs justify-between">
                    <Link href={`/customers/${encodeURIComponent(customer.name)}`}>
                      <span>كشف الحساب</span>
                      <ArrowRight className="h-3 w-3 -rotate-180" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


"use client"

import { useMemo, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Truck, ChevronLeft, Loader2, Search, Package, DollarSign, ArrowRight } from "lucide-react"
import { Order } from "@/lib/types"

export default function SuppliersPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: orders, isLoading } = useCollection<Order>(suppliersQuery as any)

  const suppliers = useMemo(() => {
    if (!orders) return []
    const grouped: Record<string, { name: string, productCount: number, totalWholesale: number, totalPaid: number, balance: number }> = {}
    
    orders.forEach(o => {
      if (!grouped[o.supplierName]) {
        grouped[o.supplierName] = { name: o.supplierName, productCount: 0, totalWholesale: 0, totalPaid: 0, balance: 0 }
      }
      grouped[o.supplierName].productCount += 1
      const receivedValue = (o.wholesalePrice * (o.quantityReceived || 0))
      grouped[o.supplierName].totalWholesale += receivedValue
      grouped[o.supplierName].totalPaid += (o.supplierPaid || 0)
      grouped[o.supplierName].balance += (receivedValue - (o.supplierPaid || 0))
    })

    return Object.values(grouped).filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.balance - a.balance)
  }, [orders, searchTerm])

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <Navbar />
      
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <h2 className="text-sm md:text-lg font-bold text-primary flex items-center gap-2">
          <Truck className="h-5 w-5" /> إدارة الموردين
        </h2>
        <div className="bg-accent/10 px-3 py-1 rounded-full text-[10px] font-bold text-accent">
          {suppliers.length} موردين
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن مورد..." 
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
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
            <Truck className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground italic text-sm">لا يوجد موردين.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {suppliers.map((supplier) => (
              <Card key={supplier.name} className="border-none shadow-sm hover:shadow-md transition-all group border-r-4 border-r-transparent hover:border-r-primary rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">{supplier.name}</CardTitle>
                        <CardDescription className="text-[10px]">{supplier.productCount} منتجات</CardDescription>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Link href={`/suppliers/${encodeURIComponent(supplier.name)}`}>
                        <ChevronLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" /> قيمة المستلم
                      </p>
                      <p className="text-sm font-bold">{supplier.totalWholesale.toLocaleString()} ج.م</p>
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3" /> المديونية له
                      </p>
                      <p className={`text-sm font-black ${supplier.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {supplier.balance.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="link" className="w-full mt-4 h-8 p-0 text-primary text-xs justify-between">
                    <Link href={`/suppliers/${encodeURIComponent(supplier.name)}`}>
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

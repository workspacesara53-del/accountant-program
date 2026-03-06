"use client"

import { useMemo, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import Link from "next/link"
import { Boxes, Search, Loader2, Package, TrendingUp, PlusCircle } from "lucide-react"
import { Order } from "@/lib/types"

export default function InventoryPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery as any)

  const inventoryItems = useMemo(() => {
    if (!orders) return []
    const grouped: Record<string, { 
      name: string, 
      count: number, 
      totalCostValue: number,
      totalSaleValue: number,
      supplierNames: Set<string>
    }> = {}
    
    orders.forEach(o => {
      const inStock = (o.quantityReceived || 0) - (o.quantityDelivered || 0)
      if (inStock > 0) {
        const name = o.productName.trim()
        if (!grouped[name]) {
          grouped[name] = { name, count: 0, totalCostValue: 0, totalSaleValue: 0, supplierNames: new Set() }
        }
        grouped[name].count += inStock
        grouped[name].totalCostValue += (inStock * o.wholesalePrice)
        grouped[name].totalSaleValue += (inStock * o.salePrice)
        grouped[name].supplierNames.add(o.supplierName)
      }
    })

    return Object.values(grouped)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.totalCostValue - a.totalCostValue)
  }, [orders, searchTerm])

  const stats = useMemo(() => {
    const cost = inventoryItems.reduce((acc, item) => acc + item.totalCostValue, 0)
    const sale = inventoryItems.reduce((acc, item) => acc + item.totalSaleValue, 0)
    return { totalCost: cost, totalSale: sale, expectedProfit: sale - cost }
  }, [inventoryItems])

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-16">
      <Navbar />
      
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 justify-between">
        <h2 className="text-sm md:text-lg font-bold text-primary flex items-center gap-2"><Boxes className="h-5 w-5" /> جرد المخزن</h2>
        <Button asChild size="sm" className="bg-accent text-primary-foreground h-8 text-[10px]">
          <Link href="/orders/new?type=stock" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>إضافة بضاعة</span>
          </Link>
        </Button>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm bg-primary/5 text-primary">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] opacity-70">قيمة التكلفة</p>
              <p className="text-sm font-black">{stats.totalCost.toLocaleString()} ج.م</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-accent/5 text-accent">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] opacity-70">الربح المتوقع</p>
              <p className="text-sm font-black">{stats.expectedProfit.toLocaleString()} ج.م</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث في المخزن..." 
            className="pr-10 h-11 text-sm shadow-sm border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-primary/20">
            <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground italic text-sm">المخزن فارغ حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems.map((item) => (
              <Card key={item.name} className="border-none shadow-sm border-r-4 border-r-accent rounded-xl overflow-hidden">
                <CardHeader className="p-4 pb-2 bg-muted/5">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-black text-primary">{item.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">{item.count} قطعة</Badge>
                  </div>
                  <CardDescription className="text-[9px] line-clamp-1">الموردين: {Array.from(item.supplierNames).join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div><p className="text-muted-foreground">التكلفة</p><p className="font-bold text-red-600">{item.totalCostValue.toLocaleString()} ج.م</p></div>
                    <div className="text-left"><p className="text-green-600 font-bold flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3" /> القيمة البيعية</p><p className="font-black text-primary">{item.totalSaleValue.toLocaleString()} ج.م</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

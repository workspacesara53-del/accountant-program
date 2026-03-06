"use client"

import { useMemo, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/layout/Navbar"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { 
  PlusCircle, Search, Package, User, Trash2, Calendar, ShoppingBag, Loader2, Truck, CheckCircle2
} from "lucide-react"
import { Order } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusConfig: Record<string, { label: string, color: string }> = {
  new: { label: "جديد", color: "#555" },
  ordered_from_supplier: { label: "مطلوب", color: "#333399" },
  partially_received: { label: "مستلم جزئي", color: "#f9a825" },
  fully_received: { label: "مستلم كامل", color: "#2e7d32" },
  unavailable: { label: "غير متوفر", color: "#d32f2f" },
  completed: { label: "مكتمل", color: "#1976d2" },
}

export default function OrdersPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: rawOrders, isLoading } = useCollection<Order>(ordersQuery as any)

  const productStock = useMemo(() => {
    if (!rawOrders) return {}
    const stock: Record<string, number> = {}
    rawOrders.forEach(o => {
      const name = o.productName.trim().toLowerCase()
      const available = (o.quantityReceived || 0) - (o.quantityDelivered || 0)
      stock[name] = (stock[name] || 0) + available
    })
    return stock
  }, [rawOrders])

  const filteredOrders = useMemo(() => {
    if (!rawOrders) return []
    let list = [...rawOrders].sort((a, b) => b.date - a.date)
    
    if (activeTab === "pending") {
      list = list.filter(o => o.quantityOrdered > o.quantityReceived && o.status !== 'unavailable')
    } else if (activeTab === "in_stock") {
      list = list.filter(o => o.quantityReceived > o.quantityDelivered)
    } else if (activeTab === "completed") {
      list = list.filter(o => o.status === 'completed')
    }

    if (!searchTerm) return list
    return list.filter(o => 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [rawOrders, searchTerm, activeTab])

  const handleDelete = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, "orders", id))
      toast({ title: "تم الحذف", description: "تم مسح السجل بنجاح من قاعدة البيانات." })
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء محاولة الحذف." })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-16">
      <Navbar />
      
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 justify-between">
        <h2 className="text-sm md:text-lg font-bold text-primary">سجل الطلبات</h2>
        <Button asChild size="sm" className="bg-accent text-primary-foreground shadow-sm">
          <Link href="/orders/new" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>إضافة منتج</span>
          </Link>
        </Button>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالمنتج، العميل أو المورد..." 
            className="pr-10 h-11 text-sm shadow-sm border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-[10px] md:text-xs font-bold">الكل</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-[10px] md:text-xs font-bold text-red-600">نواقص</TabsTrigger>
            <TabsTrigger value="in_stock" className="rounded-lg text-[10px] md:text-xs font-bold text-green-700">بالمخزن</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-[10px] md:text-xs font-bold text-blue-600">مكتمل</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">جاري تحميل سجلاتك...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground italic text-sm">لا يوجد سجلات في هذا التصنيف.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || { label: order.status, color: "#555" }
                  const dateStr = new Date(order.date).toLocaleDateString('ar-EG')
                  const inStock = order.quantityReceived - order.quantityDelivered
                  const isPending = order.quantityOrdered > order.quantityReceived
                  const totalAvailableInApp = productStock[order.productName.trim().toLowerCase()] || 0

                  return (
                    <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden border-t-4 rounded-xl" style={{ borderTopColor: status.color }}>
                      <CardHeader className="p-4 pb-2 bg-muted/5">
                        <div className="flex justify-between items-start">
                          <Badge className="text-[9px] px-2 py-0.5 text-white border-none font-bold" style={{ backgroundColor: status.color }}>{status.label}</Badge>
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><Calendar className="h-3 w-3" />{dateStr}</div>
                        </div>
                        <CardTitle className="text-sm font-black mt-2 text-primary flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-accent" />
                          {order.productName}
                        </CardTitle>
                        {order.status === 'new' && totalAvailableInApp > 0 && (
                          <div className="flex items-center gap-1 text-[8px] text-green-600 font-bold animate-pulse">
                            <CheckCircle2 className="h-3 w-3" /> متوفر بالمخزن
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">العميل:</span><span className="font-bold">{order.customerName}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">المورد:</span><span className="font-bold">{order.supplierName}</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[10px]">
                          <div className={`p-2 rounded-xl border ${isPending ? "bg-red-50 border-red-100" : "bg-primary/5"}`}>
                            <p className="font-bold">مطلوب: {order.quantityOrdered}</p>
                            <p className="opacity-70">استلام: {order.quantityReceived}</p>
                          </div>
                          <div className={`p-2 rounded-xl border ${inStock > 0 ? "bg-green-50 border-green-100" : "bg-accent/5"}`}>
                            <p className="font-bold">فائض: {inStock}</p>
                            <p className="opacity-70">بيع: {order.salePrice} ج.م</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] flex-1 bg-muted/50 rounded-lg">
                            <Link href={order.customerName === "المخزن العام" ? "/inventory" : `/customers/${encodeURIComponent(order.customerName)}`}>
                              التفاصيل
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-right">حذف السجل؟</AlertDialogTitle>
                                <AlertDialogDescription className="text-right">سيتم حذف كافة البيانات المالية المتعلقة بـ "{order.productName}" نهائياً.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 justify-end pt-4">
                                <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(order.id!)} className="bg-red-600">تأكيد الحذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/Navbar"
import { toast } from "@/hooks/use-toast"
import { User, Plus, Loader2, DollarSign } from "lucide-react"
import { Order } from "@/lib/types"

const statusConfig: Record<string, { label: string, color: string }> = {
  new: { label: "جديد", color: "#555" },
  ordered_from_supplier: { label: "مطلوب", color: "#333399" },
  partially_received: { label: "مستلم جزئي", color: "#f9a825" },
  fully_received: { label: "مستلم كامل", color: "#2e7d32" },
  unavailable: { label: "غير متوفر", color: "#d32f2f" },
  completed: { label: "مكتمل", color: "#1976d2" },
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const customerName = decodeURIComponent(params.id as string)
  const { user } = useUser()
  const db = useFirestore()
  const [paymentAmount, setPaymentAmount] = useState("")

  const customerOrdersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid), where("customerName", "==", customerName))
  }, [db, user, customerName])

  const { data: orders, isLoading } = useCollection<Order>(customerOrdersQuery as any)

  const summary = useMemo(() => {
    if (!orders) return { totalAmount: 0, totalPaid: 0, totalDue: 0 }
    const deliveredValue = orders.reduce((acc, o) => acc + (o.salePrice * (o.quantityDelivered || 0)), 0)
    const totalPaid = orders.reduce((acc, o) => acc + (o.customerPaid || 0), 0)
    return { 
      totalPaid, 
      totalDue: deliveredValue - totalPaid 
    }
  }, [orders])

  const handleUpdateDelivered = (orderId: string, val: number, received: number) => {
    if (!db) return
    if (val > received) {
      toast({ variant: "destructive", title: "تنبيه المخزن", description: `لا يمكن تسليم أكثر من ${received} قطع.` })
      return
    }
    updateDoc(doc(db, "orders", orderId), { 
      quantityDelivered: val,
      status: val > 0 && val === received ? 'completed' : val > 0 ? 'partially_received' : 'fully_received'
    })
  }

  const handleAddPayment = () => {
    if (!db || !orders || !paymentAmount || isNaN(Number(paymentAmount))) return
    let remainingPayment = Number(paymentAmount)
    orders.forEach(async (order) => {
      if (remainingPayment <= 0) return
      const orderDue = (order.salePrice * (order.quantityDelivered || 0)) - (order.customerPaid || 0)
      if (orderDue > 0) {
        const paymentForThisOrder = Math.min(remainingPayment, orderDue)
        await updateDoc(doc(db, "orders", order.id!), { 
          customerPaid: (order.customerPaid || 0) + paymentForThisOrder 
        })
        remainingPayment -= paymentForThisOrder
      }
    })
    setPaymentAmount("")
    toast({ title: "تم تسجيل الدفع", description: `تم استلام ${paymentAmount} ج.م` })
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <header className="flex h-16 shrink-0 items-center border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <h2 className="text-xs md:text-lg font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          حساب العميل: {customerName}
        </h2>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow>
                        <TableHead className="text-[10px]">المنتج</TableHead>
                        <TableHead className="text-[10px]">الحالة</TableHead>
                        <TableHead className="text-[10px]">المستحق</TableHead>
                        <TableHead className="text-[10px]">سلمت له</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => {
                        const currentDue = (order.salePrice * (order.quantityDelivered || 0)) - (order.customerPaid || 0)
                        const status = statusConfig[order.status] || { label: order.status, color: "#555" }
                        return (
                          <TableRow key={order.id} className="text-xs">
                            <TableCell className="font-bold">{order.productName}</TableCell>
                            <TableCell>
                              <Badge className="text-[8px] px-1 py-0 text-white" style={{ backgroundColor: status.color }}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-red-600 font-bold">{currentDue.toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-12 h-7 text-xs p-1 text-center font-bold"
                                defaultValue={order.quantityDelivered}
                                onBlur={(e) => handleUpdateDelivered(order.id!, Number(e.target.value), order.quantityReceived || 0)}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs opacity-90">
                  <span>إجمالي المدفوع:</span>
                  <span>{summary.totalPaid.toLocaleString()} ج.م</span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                  <span className="text-base font-bold">صافي المديونية:</span>
                  <span className="text-xl font-black text-accent">{summary.totalDue.toLocaleString()} ج.م</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">تحصيل جديد</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 flex gap-2">
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-10 text-center font-bold"
                />
                <Button onClick={handleAddPayment} className="bg-accent text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

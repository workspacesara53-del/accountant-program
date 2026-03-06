
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
import { Navbar } from "@/components/layout/Navbar"
import { toast } from "@/hooks/use-toast"
import { Truck, Plus, Loader2, DollarSign } from "lucide-react"
import { Order } from "@/lib/types"

export default function SupplierDetailsPage() {
  const params = useParams()
  const supplierName = decodeURIComponent(params.id as string)
  const { user } = useUser()
  const db = useFirestore()
  const [paymentAmount, setPaymentAmount] = useState("")

  const supplierOrdersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid), where("supplierName", "==", supplierName))
  }, [db, user, supplierName])

  const { data: orders, isLoading } = useCollection<Order>(supplierOrdersQuery as any)

  const summary = useMemo(() => {
    if (!orders) return { totalWholesale: 0, totalPaid: 0, balance: 0 }
    const totalWholesale = orders.reduce((acc, o) => acc + (o.wholesalePrice * (o.quantityReceived || 0)), 0)
    const totalPaid = orders.reduce((acc, o) => acc + (o.supplierPaid || 0), 0)
    return { totalWholesale, totalPaid, balance: totalWholesale - totalPaid }
  }, [orders])

  const handleUpdateReceived = (orderId: string, val: number, ordered: number) => {
    if (!db) return
    let newStatus = 'ordered_from_supplier'
    if (val === 0) newStatus = 'ordered_from_supplier'
    else if (val < ordered) newStatus = 'partially_received'
    else newStatus = 'fully_received'
    updateDoc(doc(db, "orders", orderId), { quantityReceived: val, status: newStatus as any })
  }

  const handleAddPayment = () => {
    if (!db || !orders || !paymentAmount || isNaN(Number(paymentAmount))) return
    let remainingPayment = Number(paymentAmount)
    orders.forEach(async (order) => {
      if (remainingPayment <= 0) return
      const orderBalance = (order.wholesalePrice * (order.quantityReceived || 0)) - (order.supplierPaid || 0)
      if (orderBalance > 0) {
        const paymentForThisOrder = Math.min(remainingPayment, orderBalance)
        await updateDoc(doc(db, "orders", order.id!), { supplierPaid: (order.supplierPaid || 0) + paymentForThisOrder })
        remainingPayment -= paymentForThisOrder
      }
    })
    setPaymentAmount("")
    toast({ title: "تم تسجيل الصرف", description: `تم صرف ${paymentAmount} ج.م` })
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <header className="flex h-16 shrink-0 items-center border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <h2 className="text-xs md:text-lg font-semibold flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          حساب المورد: {supplierName}
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
                        <TableHead className="text-[10px]">العميل</TableHead>
                        <TableHead className="text-[10px]">المنتج</TableHead>
                        <TableHead className="text-[10px]">المستحق</TableHead>
                        <TableHead className="text-[10px]">المستلم</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => {
                        const currentDue = (order.wholesalePrice * (order.quantityReceived || 0)) - (order.supplierPaid || 0)
                        return (
                          <TableRow key={order.id} className="text-xs">
                            <TableCell className="text-primary font-bold">{order.customerName}</TableCell>
                            <TableCell className="max-w-[80px] truncate">{order.productName}</TableCell>
                            <TableCell className="font-bold text-red-600">{currentDue.toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-12 h-7 text-xs p-1 text-center font-bold"
                                defaultValue={order.quantityReceived}
                                onBlur={(e) => handleUpdateReceived(order.id!, Number(e.target.value), order.quantityOrdered)}
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
            <Card className="border-none shadow-sm bg-accent text-primary-foreground rounded-xl">
              <CardContent className="p-4 space-y-3 text-primary">
                <div className="flex justify-between text-xs opacity-90">
                  <span>إجمالي المدفوع له:</span>
                  <span>{summary.totalPaid.toLocaleString()} ج.م</span>
                </div>
                <div className="pt-3 border-t border-primary/20 flex justify-between items-center">
                  <span className="text-base font-bold">صافي المديونية:</span>
                  <span className="text-xl font-black text-red-600">{summary.balance.toLocaleString()} ج.م</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">تسديد دفعة</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 flex gap-2">
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-10 text-center font-bold"
                />
                <Button onClick={handleAddPayment} className="bg-primary text-primary-foreground">
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

"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { toast } from "@/hooks/use-toast"
import { Boxes, Info, Loader2 } from "lucide-react"
import { Order } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const db = useFirestore()
  
  const [formData, setFormData] = useState({
    customerName: "",
    productName: "",
    supplierName: "",
    wholesalePrice: "",
    salePrice: "",
    quantityOrdered: "",
    isStockOrder: false,
    note: ""
  })

  useEffect(() => {
    if (searchParams.get("type") === "stock") {
      setFormData(prev => ({ ...prev, isStockOrder: true }))
    }
  }, [searchParams])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: existingOrders } = useCollection<Order>(ordersQuery as any)

  const suggestions = useMemo(() => {
    if (!existingOrders) return { customers: [], products: [], suppliers: [] }
    const customers = Array.from(new Set(existingOrders.map(o => o.customerName))).filter(name => name !== "المخزن العام")
    const products = Array.from(new Set(existingOrders.map(o => o.productName)))
    const suppliers = Array.from(new Set(existingOrders.map(o => o.supplierName)))
    return { customers, products, suppliers }
  }, [existingOrders])

  const currentProductStock = useMemo(() => {
    if (!existingOrders) return 0
    const pName = formData.productName.trim().toLowerCase()
    return existingOrders.reduce((acc, o) => {
      if (o.productName.trim().toLowerCase() === pName) {
        return acc + ((o.quantityReceived || 0) - (o.quantityDelivered || 0))
      }
      return acc
    }, 0)
  }, [formData.productName, existingOrders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    const customer = formData.isStockOrder ? "المخزن العام" : formData.customerName

    if (!customer || !formData.productName || !formData.supplierName || !formData.quantityOrdered) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى ملء جميع الخانات الأساسية للطلب." })
      return
    }

    setIsSubmitting(true)
    try {
      const newOrder: Omit<Order, 'id'> = {
        date: Date.now(),
        customerName: customer,
        productName: formData.productName,
        supplierName: formData.supplierName,
        wholesalePrice: Number(formData.wholesalePrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        quantityOrdered: Number(formData.quantityOrdered) || 1,
        quantityReceived: 0,
        quantityDelivered: 0,
        status: 'new',
        customerPaid: 0,
        supplierPaid: 0,
        note: formData.note,
        userId: user.uid
      }

      await addDoc(collection(db, "orders"), newOrder)
      toast({ title: "تم الحفظ", description: "تم تسجيل الصنف بنجاح." })
      router.push(formData.isStockOrder ? "/inventory" : "/orders")
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحفظ." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl border-none shadow-xl">
      <CardHeader className="text-center bg-primary/5 rounded-t-xl p-4">
        <CardTitle className="text-base font-black text-primary flex items-center justify-center gap-2">
          <Boxes className="h-5 w-5" /> فورم الإدخال الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {formData.productName && currentProductStock > 0 && !formData.isStockOrder && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <Info className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-xs font-bold">تنبيه المخزن</AlertTitle>
              <AlertDescription className="text-[10px]">
                يوجد <span className="font-black underline">{currentProductStock} قطع</span> من "{formData.productName}" متوفرة حالياً في المخزن العام.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2 space-x-reverse bg-accent/10 p-3 rounded-xl border border-accent/20">
            <input type="checkbox" id="stockOrder" checked={formData.isStockOrder} onChange={(e) => setFormData({ ...formData, isStockOrder: e.target.checked })} className="h-5 w-5 rounded border-accent text-accent" />
            <Label htmlFor="stockOrder" className="cursor-pointer font-bold text-primary text-sm">بضاعة للمخزن العام (بدون عميل)</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!formData.isStockOrder && (
              <div className="space-y-1">
                <Label className="text-xs font-bold">اسم العميل</Label>
                <Input list="customer-list" placeholder="اختر أو اكتب اسم عميل" className="h-10 text-sm" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                <datalist id="customer-list">{suggestions.customers.map(name => <option key={name} value={name} />)}</datalist>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-bold">اسم المورد</Label>
              <Input list="supplier-list" placeholder="اختر أو اكتب اسم مورد" className="h-10 text-sm" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} />
              <datalist id="supplier-list">{suggestions.suppliers.map(name => <option key={name} value={name} />)}</datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">اسم المنتج</Label>
              <Input list="product-list" placeholder="اختر أو اكتب اسم منتج" className="h-10 text-sm" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
              <datalist id="product-list">{suggestions.products.map(name => <option key={name} value={name} />)}</datalist>
            </div>
            <div className="space-y-1"><Label className="text-xs font-bold">الكمية</Label><Input type="number" className="h-10 text-sm font-bold text-center" value={formData.quantityOrdered} onChange={(e) => setFormData({ ...formData, quantityOrdered: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs font-bold text-green-700">سعر الجملة</Label><Input type="number" className="h-10 text-sm font-bold text-center" value={formData.wholesalePrice} onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs font-bold text-blue-700">سعر البيع</Label><Input type="number" className="h-10 text-sm font-bold text-center" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} /></div>
          </div>

          <div className="space-y-1"><Label className="text-xs font-bold">ملاحظات</Label><Textarea className="min-h-[80px] text-sm" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} /></div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-accent hover:bg-accent/90 text-primary-foreground font-bold">{isSubmitting ? "جاري الحفظ..." : "حفظ الآن"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-11">إلغاء</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function NewOrderPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-16">
      <Navbar />
      <header className="flex h-16 shrink-0 items-center border-b px-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <h2 className="text-lg font-bold text-primary">تسجيل صنف جديد</h2>
      </header>
      <main className="p-4 md:p-6 flex justify-center">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <NewOrderForm />
        </Suspense>
      </main>
    </div>
  )
}

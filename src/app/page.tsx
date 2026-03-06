"use client"

import { useState, useMemo } from "react"
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Boxes, PieChart, Landmark, ShoppingBag, PlusCircle, LogIn, Loader2, Edit3, Check, BarChart3, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Order, UserSettings } from "@/lib/types"
import { AIInsight } from "@/components/dashboard/AIInsight"
import { QuickActions } from "@/components/layout/QuickActions"
import { Navbar } from "@/components/layout/Navbar"
import { Bar, BarChart, ResponsiveContainer, XAxis, Cell } from "recharts"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isEditingCapital, setIsEditingCapital] = useState(false)
  const [tempCapital, setTempCapital] = useState("")

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "systemUsers", user.uid)
  }, [db, user])
  
  const { data: settings } = useDoc<UserSettings>(settingsRef as any)

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: rawOrders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery as any)

  const orders = useMemo(() => {
    if (!rawOrders) return []
    return [...rawOrders].sort((a, b) => b.date - a.date)
  }, [rawOrders])

  const summary = useMemo(() => {
    const initialCapital = settings?.initialCapital || 0
    if (!orders) return { 
      availableCapital: initialCapital, 
      owedByCustomers: 0, 
      owedToSuppliers: 0, 
      inventoryValue: 0, 
      totalProfits: 0,
      initialCapital
    }
    
    const totalCustomerPaid = orders.reduce((acc, o) => acc + (o.customerPaid || 0), 0)
    const totalSupplierPaid = orders.reduce((acc, o) => acc + (o.supplierPaid || 0), 0)
    const inventoryValue = orders.reduce((acc, o) => {
      const inStock = (o.quantityReceived || 0) - (o.quantityDelivered || 0)
      return acc + (Math.max(0, inStock) * o.wholesalePrice)
    }, 0)
    const owedByCustomers = orders.reduce((acc, o) => acc + ((o.salePrice * (o.quantityDelivered || 0)) - (o.customerPaid || 0)), 0)
    const owedToSuppliers = orders.reduce((acc, o) => acc + ((o.wholesalePrice * (o.quantityReceived || 0)) - (o.supplierPaid || 0)), 0)
    const totalProfits = orders.reduce((acc, o) => acc + ((o.salePrice * (o.quantityDelivered || 0)) - (o.wholesalePrice * (o.quantityReceived || 0))), 0)

    return {
      availableCapital: initialCapital + totalCustomerPaid - totalSupplierPaid,
      owedByCustomers,
      owedToSuppliers,
      inventoryValue,
      totalProfits,
      initialCapital
    }
  }, [orders, settings])

  const chartData = [
    { name: "رأس المال", value: 50000, color: "#333399" },
    { name: "السيولة", value: 35000, color: "#22c55e" },
    { name: "المخزن", value: 15000, color: "#4DB8FF" },
    { name: "ديون لنا", value: 8000, color: "#6366f1" },
  ]

  const handleUpdateCapital = () => {
    if (!db || !user || !tempCapital || isNaN(Number(tempCapital))) return
    setDoc(doc(db, "systemUsers", user.uid), { initialCapital: Number(tempCapital) }, { merge: true })
    setIsEditingCapital(false)
    setTempCapital("")
  }

  const handleLockedChart = () => {
    toast({
      title: "تحليل مالي متقدم",
      description: "الرسوم البيانية التفاعلية متوفرة في النسخة الاحترافية، للتفعيل يرجى التواصل مع مصمم البرنامج.",
    })
  }

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-primary">مدبر الأرباح</h1>
        <p className="text-muted-foreground italic">النظام محمي. يرجى تسجيل الدخول للوصول لبياناتك.</p>
        <Button asChild className="gap-2">
          <Link href="/login"><LogIn className="h-4 w-4" /> تسجيل الدخول</Link>
        </Button>
      </div>
    )
  }

  const stats = [
    { title: "السيولة (كاش)", value: summary.availableCapital, icon: Wallet, color: "text-green-600", bg: "bg-green-50", showEdit: true },
    { title: "قيمة المخزن", value: summary.inventoryValue, icon: Boxes, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "عند العملاء", value: summary.owedByCustomers, icon: PieChart, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "للموردين", value: summary.owedToSuppliers, icon: Landmark, color: "text-red-600", bg: "bg-red-50" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-16">
      <Navbar />
      
      <header className="flex h-16 shrink-0 items-center justify-between px-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 md:hidden">
        <h2 className="text-sm md:text-lg font-bold text-primary">الوضع المالي</h2>
        <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-primary-foreground h-8 text-[10px]">
          <Link href="/orders/new" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>إضافة صنف</span>
          </Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-1.5 rounded-full ${stat.bg}`}><stat.icon className={`h-3 w-3 ${stat.color}`} /></div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between min-h-[30px]">
                  {stat.showEdit && isEditingCapital ? (
                    <div className="flex gap-1 w-full">
                      <Input 
                        type="number" 
                        className="h-7 text-[10px] font-bold" 
                        autoFocus
                        value={tempCapital}
                        onChange={(e) => setTempCapital(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCapital()}
                      />
                      <Button size="icon" className="h-7 w-7" onClick={handleUpdateCapital}><Check className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm md:text-lg font-black">{stat.value.toLocaleString()}</div>
                      {stat.showEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 opacity-40" 
                          onClick={() => {
                            setTempCapital(summary.initialCapital.toString())
                            setIsEditingCapital(true)
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-sm overflow-hidden relative group cursor-pointer" onClick={handleLockedChart}>
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="h-10 w-10 text-primary mb-3" />
                <p className="text-xs font-bold text-primary max-w-[200px]">هذه التقارير البيانية متوفرة في النسخة المدفوعة، للتفعيل تواصل مع مصمم البرنامج.</p>
              </div>

              <CardHeader className="bg-muted/5 border-b py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" /> تحليل التوزيع المالي (ديمو)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[250px] w-full blur-[3px] select-none pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <AIInsight data={{
              totalProfits: summary.totalProfits,
              totalLosses: 0,
              availableCapital: summary.availableCapital,
              totalOwedByCustomers: summary.owedByCustomers,
              totalOwedToSuppliers: summary.owedToSuppliers
            }} />
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="py-4 border-b bg-muted/5"><CardTitle className="text-sm font-bold">آخر الحركات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[350px]">
                {isOrdersLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground italic text-xs">لا يوجد بيانات مسجلة.</div>
                ) : (
                  <div className="divide-y">
                    {orders.slice(0, 15).map((o) => (
                      <div key={o.id} className="flex gap-3 items-center p-3 hover:bg-muted/30 transition-colors">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary"><ShoppingBag className="h-3.5 w-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{o.customerName}: {o.productName}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(o.date).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <div className="text-xs font-black text-primary">{(o.salePrice * (o.quantityDelivered || 0)).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
      <QuickActions />
    </div>
  )
}
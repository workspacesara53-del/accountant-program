
"use client"

import { useState } from "react"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "تم تسجيل الدخول", description: "مرحباً بكِ في نظام مدبر الأرباح" })
      router.push("/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ في الدخول", description: "يرجى التأكد من البريد وكلمة السر" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">مدبر الأرباح</CardTitle>
          <CardDescription>سجلي دخولكِ للوصول إلى الحسابات المحمية</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="كلمة السر" className="flex items-center gap-2"><Lock className="h-4 w-4" /> كلمة السر</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground text-center">
            هذا النظام محمي بأعلى معايير الأمان وتشفير Firebase.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

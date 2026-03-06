"use client"

import { Sparkles, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function AIInsight({ data }: { data: any }) {
  const { toast } = useToast()

  const handleLockedFeature = () => {
    toast({
      title: "ميزة إضافية",
      description: "تحليل الذكاء الاصطناعي متوفر في النسخة الاحترافية، للتفعيل يرجى التواصل مع مصمم البرنامج.",
    })
  }

  return (
    <Card className="border-accent/20 bg-accent/5 relative overflow-hidden group">
      {/* Overlay for Locked State */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Lock className="h-8 w-8 text-primary mb-2" />
        <p className="text-[10px] font-bold text-primary">هذه الميزة متوفرة في النسخة المدفوعة، للتفعيل تواصل مع مصمم البرنامج.</p>
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          تحليل الذكاء الاصطناعي
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLockedFeature}
          className="h-8 gap-1 text-xs"
        >
          تحديث التحليل
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 blur-[2px] pointer-events-none select-none">
          <p className="text-sm leading-relaxed text-muted-foreground">
            بناءً على بياناتك الحالية، نلاحظ نمواً بنسبة 15% في الأرباح المحققة مع وجود سيولة جيدة تغطي الالتزامات القادمة للموردين... (مثال للتحليل)
          </p>
        </div>
        <div className="mt-4 text-center">
          <Button onClick={handleLockedFeature} variant="outline" size="sm" className="gap-2 border-accent text-accent">
            <Sparkles className="h-4 w-4" />
            توليد تقرير ذكي (نسخة تجريبية)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

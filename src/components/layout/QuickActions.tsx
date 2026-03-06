"use client"

import { Plus, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function QuickActions() {
  const { toast } = useToast()

  const handleQuickAction = () => {
    toast({
      title: "الوصول السريع",
      description: "هذه الميزة متوفرة في النسخة المدفوعة، للتفعيل تواصل مع مصمم البرنامج.",
    })
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 md:hidden flex flex-col items-center gap-2">
      <span className="bg-primary/90 text-white text-[8px] px-2 py-0.5 rounded-full animate-bounce">
        تواصل للمزيد
      </span>
      <Button 
        size="icon" 
        onClick={handleQuickAction}
        className="h-14 w-14 rounded-full shadow-2xl bg-accent text-primary-foreground hover:bg-accent/90 transition-transform active:scale-90"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  )
}

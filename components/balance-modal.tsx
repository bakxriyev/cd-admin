"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, MessageCircle, Phone } from "lucide-react"

interface InsufficientBalanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBalance: number
  requiredAmount: number
}

export function InsufficientBalanceModal({
  open,
  onOpenChange,
  currentBalance,
  requiredAmount,
}: InsufficientBalanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <DialogTitle className="text-white text-xl">Balans Yetarli Emas</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            User yaratish uchun balans yetarli emas. Balansni to'ldirish uchun biz bilan bog'laning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Balance Info */}
          <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Joriy balans:</span>
              <span className="text-white font-semibold">${currentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kerakli miqdor:</span>
              <span className="text-emerald-400 font-semibold">${requiredAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-600 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Yetishmayotgan:</span>
                <span className="text-red-400 font-bold">${(requiredAmount - currentBalance).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <p className="text-slate-300 font-medium">Balansni to'ldirish uchun aloqaga chiqing:</p>

            <div className="space-y-2">
              <a
                href="https://t.me/realexamielts"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white font-medium">Telegram</div>
                  <div className="text-sm text-slate-400">@realexamielts</div>
                </div>
              </a>

              <a
                href="tel:+998901234567"
                className="flex items-center gap-3 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-white font-medium">Telefon</div>
                  <div className="text-sm text-slate-400">+998 90 123 45 67</div>
                </div>
              </a>

              <a
                href="tel:+998991234567"
                className="flex items-center gap-3 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-white font-medium">Telefon</div>
                  <div className="text-sm text-slate-400">+998 99 123 45 67</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
          Yopish
        </Button>
      </DialogContent>
    </Dialog>
  )
}

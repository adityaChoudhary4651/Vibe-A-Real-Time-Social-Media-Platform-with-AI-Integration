import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Heart, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tipAmounts = [1, 5, 10, 25, 50, 100];

interface TipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorName?: string;
}

export function TipModal({ open, onOpenChange, creatorName = "Creator" }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleSendTip = async () => {
    if (!amount || amount <= 0) return;
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSending(false);
    toast.success(`Sent $${amount} tip to ${creatorName}!`, {
      icon: <Heart className="h-4 w-4 fill-destructive text-destructive" />,
    });
    onOpenChange(false);
    setSelectedAmount(null);
    setCustomAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Tip {creatorName}
          </DialogTitle>
          <DialogDescription>
            Show your appreciation with a tip!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-3">
            {tipAmounts.map((tip) => (
              <motion.button
                key={tip}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAmount(tip);
                  setCustomAmount("");
                }}
                className={cn(
                  "py-3 rounded-xl border-2 font-semibold transition-all",
                  selectedAmount === tip && !customAmount
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                ${tip}
              </motion.button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Custom amount"
              className="pl-10"
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendTip}
            disabled={!amount || amount <= 0 || isSending}
            variant="gradient"
            size="lg"
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Send ${amount || 0} Tip
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Tips are processed securely. Test mode - no real charges.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
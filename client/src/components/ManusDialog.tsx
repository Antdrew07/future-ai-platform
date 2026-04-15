import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface FutureAuthDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: FutureAuthDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-[#0d0d14] rounded-2xl w-[400px] shadow-2xl border border-white/10 backdrop-blur-2xl p-0 gap-0 text-center">
        <div className="flex flex-col items-center gap-3 p-6 pt-10">
          {logo ? (
            <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
              <img src={logo} alt="App logo" className="w-9 h-9 rounded-md" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          )}

          {title ? (
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              {title}
            </DialogTitle>
          ) : (
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              Welcome to Future
            </DialogTitle>
          )}

          <DialogDescription className="text-sm text-white/50 leading-5">
            Sign in to build and deploy autonomous AI agents
          </DialogDescription>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button
            onClick={onLogin}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue with Future
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

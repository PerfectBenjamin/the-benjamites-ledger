"use client";

import { useEffect, useState } from "react";
import CustomerForm from "./customer-form";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "./ui/dialog";

interface EditCustomerPanelProps {
  initialData: any;
  customerId: string;
}

export default function EditCustomerPanel({
  initialData,
  customerId,
}: EditCustomerPanelProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const handle = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle as any);
    };
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-3 py-2 rounded-md text-sm md:text-base"
          style={{
            WebkitTapHighlightColor: "transparent",
            WebkitAppearance: "none",
            appearance: "none",
            backgroundColor: "#059669",
            border: "none",
          }}
        >
          Edit
        </button>
      </DialogTrigger>

      <DialogContent mobileFullscreen={isMobile}>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <CustomerForm
            initialData={initialData}
            customerId={customerId}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { OutreachScreen } from "@/components/outreach/OutreachScreen";
import { Suspense } from "react";

export const metadata = {
  title: "Outreach · ApplyPilot",
};

export default function OutreachPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading outreach…</p>}>
      <OutreachScreen />
    </Suspense>
  );
}

import { AnalysisView } from "@/components/analysis/AnalysisView";
import { demoAnalysis } from "@/data/demo-analysis";

export const metadata = {
  title: "Demo analysis · ApplyPilot",
};

export default function DemoAnalysisPage() {
  return <AnalysisView analysis={demoAnalysis} />;
}

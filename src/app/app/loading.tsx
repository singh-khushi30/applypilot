import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
      <Skeleton className="h-12 w-72 motion-reduce:animate-none" />
      <Skeleton className="h-40 w-full rounded-3xl motion-reduce:animate-none" />
    </div>
  );
}

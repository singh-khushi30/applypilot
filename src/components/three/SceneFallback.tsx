type SceneFallbackProps = {
  notice?: boolean;
};

export function SceneFallback({ notice = false }: SceneFallbackProps) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative h-56 w-56 sm:h-64 sm:w-72" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 h-24 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-cream shadow-[0_18px_40px_-28px_rgba(74,61,100,0.7)]">
          <div className="absolute -top-10 left-1 h-16 w-[8.5rem] origin-bottom -rotate-6 rounded-xl bg-[#efe6f8]" />
        </div>
        <div className="absolute top-6 left-2 h-16 w-12 rotate-[-8deg] rounded-lg bg-cream shadow-sm" />
        <div className="absolute top-8 right-1 h-12 w-16 rotate-[7deg] rounded-lg bg-powder" />
        <div className="absolute bottom-6 left-6 size-8 rounded-full bg-lavender" />
        <div className="absolute right-8 bottom-8 size-5 rounded-full bg-blush" />
      </div>
      {notice ? (
        <p className="absolute bottom-4 px-6 text-center text-xs text-muted-foreground">
          A still preview is showing in place of the 3D workspace.
        </p>
      ) : null}
    </div>
  );
}

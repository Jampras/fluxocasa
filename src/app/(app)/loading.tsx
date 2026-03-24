function LoadingCard({ accentClass = "bg-white" }: { accentClass?: string }) {
  return (
    <div className="overflow-hidden border-[3px] border-neo-dark bg-white shadow-[4px_4px_0_#0F172A] sm:border-4 sm:shadow-[5px_5px_0_#0F172A]">
      <div className={`border-b-[3px] border-neo-dark px-3 py-2 sm:border-b-4 sm:px-4 sm:py-3 ${accentClass}`}>
        <div className="h-3 w-24 animate-pulse bg-neo-dark/15 sm:h-4 sm:w-28" />
      </div>
      <div className="space-y-3 p-3 sm:p-4 md:p-5">
        <div className="h-9 w-32 animate-pulse bg-neo-dark/10 sm:h-12 sm:w-40" />
        <div className="h-3 w-full animate-pulse bg-neo-dark/10" />
        <div className="h-3 w-3/4 animate-pulse bg-neo-dark/10" />
      </div>
    </div>
  );
}

export default function AppLoading() {
  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse bg-neo-pink/20 sm:h-5" />
          <div className="h-12 w-64 animate-pulse bg-neo-dark/10 sm:h-16 sm:w-80" />
        </div>
        <div className="h-1 w-full bg-neo-dark/15" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LoadingCard accentClass="bg-neo-cyan" />
        <LoadingCard accentClass="bg-neo-yellow" />
        <LoadingCard />
        <LoadingCard accentClass="bg-neo-lime" />
      </div>

      <div className="border-[3px] border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A]">
        <div className="mb-4 h-5 w-40 animate-pulse bg-neo-dark/10" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square border-2 border-neo-dark/10 bg-neo-bg/50 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="border-[3px] border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A]">
        <div className="mb-4 h-6 w-48 animate-pulse bg-neo-dark/10" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-b border-neo-dark/10 pb-4">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse bg-neo-dark/10" />
                <div className="h-3 w-24 animate-pulse bg-neo-dark/10" />
              </div>
              <div className="h-5 w-24 animate-pulse bg-neo-dark/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

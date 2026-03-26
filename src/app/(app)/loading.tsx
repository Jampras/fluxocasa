function LoadingCard({ accentClass = "bg-neo-cream" }: { accentClass?: string }) {
  return (
    <div className="neo-pop-in overflow-hidden border-[3px] border-neo-dark bg-neo-cream shadow-[4px_4px_0_#0F172A] sm:border-4 sm:shadow-[5px_5px_0_#0F172A]">
      <div className={`border-b-[3px] border-neo-dark px-3 py-2 sm:border-b-4 sm:px-4 sm:py-3 ${accentClass}`}>
        <div className="neo-shimmer h-3 w-24 bg-neo-dark/15 sm:h-4 sm:w-28" />
      </div>
      <div className="space-y-3 p-3 sm:p-4 md:p-5">
        <div className="neo-shimmer h-9 w-32 bg-neo-dark/10 sm:h-12 sm:w-40" />
        <div className="neo-shimmer h-3 w-full bg-neo-dark/10" />
        <div className="neo-shimmer h-3 w-3/4 bg-neo-dark/10" />
      </div>
    </div>
  );
}

export default function AppLoading() {
  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="neo-shimmer h-4 w-32 bg-neo-pink/20 sm:h-5" />
          <div className="neo-shimmer h-12 w-64 bg-neo-dark/10 sm:h-16 sm:w-80" />
        </div>
        <div className="h-1 w-full bg-neo-dark/15" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LoadingCard accentClass="bg-neo-cyan" />
        <LoadingCard accentClass="bg-neo-yellow" />
        <LoadingCard />
        <LoadingCard accentClass="bg-neo-lime" />
      </div>

      <div className="border-[3px] border-neo-dark bg-neo-cream p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A]">
        <div className="neo-shimmer mb-4 h-5 w-40 bg-neo-dark/10" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="neo-shimmer aspect-square border-2 border-neo-dark/10 bg-neo-bg/50"
            />
          ))}
        </div>
      </div>

      <div className="border-[3px] border-neo-dark bg-neo-cream p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A]">
        <div className="neo-shimmer mb-4 h-6 w-48 bg-neo-dark/10" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-b border-neo-dark/10 pb-4">
              <div className="space-y-2">
                <div className="neo-shimmer h-5 w-32 bg-neo-dark/10" />
                <div className="neo-shimmer h-3 w-24 bg-neo-dark/10" />
              </div>
              <div className="neo-shimmer h-5 w-24 bg-neo-dark/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

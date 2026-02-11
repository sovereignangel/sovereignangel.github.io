export default function TwentyFourHourBanner() {
  return (
    <div className="bg-amber-bg border border-amber-ink/20 rounded-sm px-4 py-3 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-amber-ink text-lg leading-none mt-0.5">&#9888;</span>
        <div>
          <p className="font-serif text-[13px] font-semibold text-amber-ink">
            24-Hour Rule Active
          </p>
          <p className="font-sans text-[12px] text-ink-light mt-1">
            You can decide tomorrow. Ship your spine project today instead.
          </p>
        </div>
      </div>
    </div>
  )
}

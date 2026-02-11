import Image from 'next/image'

export default function Header() {
  return (
    <header className="mb-12">
      <Image
        src="/Main.jpeg"
        alt="Lori Corpuz"
        width={120}
        height={120}
        className="rounded-full object-cover mb-6 grayscale-[10%]"
        priority
      />
      <h1 className="text-[28px] font-semibold tracking-tight mb-2">
        Lori Corpuz
      </h1>
      <p className="text-[#666] text-[15px] tracking-wide">
        Emergence · AI · Markets · Mind
      </p>
    </header>
  )
}

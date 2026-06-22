import Header from '@/components/portfolio/Header'
import AboutSection from '@/components/portfolio/AboutSection'
import Footer from '@/components/portfolio/Footer'

export default function Home() {
  return (
    <div className="max-w-[640px] mx-auto py-20 px-6 max-[480px]:py-12 max-[480px]:px-5">
      <Header />
      <AboutSection />
      <Footer />
    </div>
  )
}

import Header from '@/components/sections/Header'
import Hero from '@/components/sections/Hero'
import ProblemSolution from '@/components/sections/ProblemSolution'
import FeatureGrid from '@/components/sections/FeatureGrid'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <FeatureGrid />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}

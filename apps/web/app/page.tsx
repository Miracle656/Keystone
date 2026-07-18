import { TopRail } from "@/components/landing/TopRail";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { RouterFlow } from "@/components/landing/RouterFlow";
import { Thesis } from "@/components/landing/Thesis";
import { ThreeLayers } from "@/components/landing/ThreeLayers";
import { Roadmap } from "@/components/landing/Roadmap";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopRail />
      <Nav />
      <Hero />
      <StatsStrip />
      <RouterFlow />
      <Thesis />
      <ThreeLayers />
      <Roadmap />
      <CTA />
      <Footer />
    </div>
  );
}

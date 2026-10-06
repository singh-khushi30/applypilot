import { Features } from "@/components/landing/Features";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Workflow } from "@/components/landing/Workflow";

export default function Home() {
  return (
    <div id="top" className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <Workflow />
        <ProductPreview />
        <Features />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

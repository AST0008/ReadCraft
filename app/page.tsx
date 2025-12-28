import Hero from "@/components/hero";
import Feature from "@/components/feature";
import CTA from "@/components/cta";
import Footer from "@/components/footer";
import Header from "@/components/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Feature />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

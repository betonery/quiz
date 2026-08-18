import { LandingAudience } from "./landing-audience";
import { LandingBenefits } from "./landing-benefits";
import { LandingComparison } from "./landing-comparison";
import { LandingComponents } from "./landing-components";
import { LandingData } from "./landing-data";
import { LandingDemo } from "./landing-demo";
import { LandingDifferentiators } from "./landing-differentiators";
import { LandingEditor } from "./landing-editor";
import { LandingFaq } from "./landing-faq";
import { LandingFinalCta } from "./landing-final-cta";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingIntegrations } from "./landing-integrations";
import { LandingPerformance } from "./landing-performance";
import { LandingPlatform } from "./landing-platform";
import { LandingPricing } from "./landing-pricing";
import { LandingTestimonials } from "./landing-testimonials";
import { LandingWhy } from "./landing-why";

type LandingPageProps = {
  isAuthenticated: boolean;
};

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main>
        <LandingHero />
        <LandingDemo />
        <LandingWhy />
        <LandingPlatform />
        <LandingEditor />
        <LandingComponents />
        <LandingPerformance />
        <LandingIntegrations />
        <LandingAudience />
        <LandingData />
        <LandingComparison />
        <LandingBenefits />
        <LandingDifferentiators />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFaq />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}

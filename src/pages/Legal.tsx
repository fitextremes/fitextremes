import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "t-1", label: "1. Acceptance of Terms", parent: "terms" },
  { id: "t-2", label: "2. Eligibility", parent: "terms" },
  { id: "t-3", label: "3. Health & Medical Disclaimer", parent: "terms" },
  { id: "t-4", label: "4. User Accounts", parent: "terms" },
  { id: "t-5", label: "5. User Content", parent: "terms" },
  { id: "t-6", label: "6. Fitness Centre & Trainer Listings", parent: "terms" },
  { id: "t-7", label: "7. Subscriptions & Payments", parent: "terms" },
  { id: "t-8", label: "8. AI Features & Recommendations", parent: "terms" },
  { id: "t-9", label: "9. Intellectual Property", parent: "terms" },
  { id: "t-10", label: "10. Limitation of Liability", parent: "terms" },
  { id: "t-11", label: "11. Privacy", parent: "terms" },
  { id: "t-12", label: "12. Account Termination", parent: "terms" },
  { id: "t-13", label: "13. Changes to Terms", parent: "terms" },
  { id: "t-14", label: "14. Governing Law", parent: "terms" },
  { id: "t-15", label: "15. Contact Information", parent: "terms" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "p-1", label: "1. Introduction", parent: "privacy" },
  { id: "p-2", label: "2. Information We Collect", parent: "privacy" },
  { id: "p-3", label: "3. How We Use Information", parent: "privacy" },
  { id: "p-4", label: "4. Legal Basis", parent: "privacy" },
  { id: "p-5", label: "5. Sharing of Information", parent: "privacy" },
  { id: "p-6", label: "6. Data Storage & Security", parent: "privacy" },
  { id: "p-7", label: "7. International Users", parent: "privacy" },
  { id: "p-8", label: "8. Cookies & Analytics", parent: "privacy" },
  { id: "p-9", label: "9. Your Rights", parent: "privacy" },
  { id: "p-10", label: "10. Data Retention", parent: "privacy" },
  { id: "p-11", label: "11. Children's Privacy", parent: "privacy" },
  { id: "p-12", label: "12. Third-Party Services", parent: "privacy" },
  { id: "p-13", label: "13. Changes to This Policy", parent: "privacy" },
  { id: "p-14", label: "14. Contact Us", parent: "privacy" },
  { id: "additions", label: "Recommended Additions" },
  { id: "appstore", label: "App Store Compliance" },
];

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="font-display text-2xl uppercase tracking-wider text-foreground mt-12 mb-4 scroll-mt-28">
    {children}
  </h2>
);
const H3 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h3 id={id} className="font-semibold text-lg text-foreground mt-8 mb-3 scroll-mt-28">
    {children}
  </h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed text-muted-foreground mb-3">{children}</p>
);
const UL = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);

const Legal = () => {
  const [active, setActive] = useState<string>("introduction");

  useEffect(() => {
    document.title = "FitExtremes — Terms Conditions & Privacy Policies";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "FitExtremes Terms & Conditions and Privacy Policy for Social Users, Personal Trainers, Supplement Stores, and Fitness Centres in Canada and worldwide.";
    if (meta) meta.setAttribute("content", desc);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar minimal />

      {/* Sticky header */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-primary mb-1">FitExtremes</p>
          <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">
            Terms Conditions &amp; Privacy Policies
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Effective Date: May 19, 2026 · Version v1.0</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Contents</p>
              <ul className="space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id} className={s.parent ? "pl-3" : ""}>
                    <button
                      onClick={() => scrollTo(s.id)}
                      className={`text-left text-xs w-full py-1 hover:text-primary transition-colors ${
                        active === s.id ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="max-w-3xl">
            <section id="introduction" className="scroll-mt-28">
              <H2 id="introduction">Introduction</H2>
              <P>Below is a strong starter version of a Terms &amp; Conditions and Privacy Policy for the fitness app FitExtremes, designed for:</P>
              <UL items={[
                "Canada (including Ontario privacy expectations)",
                "Global users",
                "Mobile + web app",
                "Fitness tracking / social fitness / community features",
                "Future monetization, subscriptions, trainers, gyms/fitness centres, and AI features",
              ]} />
              <P><strong className="text-foreground">Important:</strong> This is a professional template for MVP/startup stage. Before launch at scale, paid subscriptions, health integrations, or legal disputes, a Canadian lawyer should review it — especially if you later add wearable integrations, health data, payments/subscriptions, coaching, AI recommendations, child users, or medical advice features.</P>
            </section>

            <section id="terms" className="scroll-mt-28">
              <H2 id="terms">Terms &amp; Conditions</H2>
              <p className="text-xs text-muted-foreground mb-6">for FitExtremes · Effective Date: May 19, 2026</p>

              <H3 id="t-1">1. Acceptance of Terms</H3>
              <P>By accessing or using FitExtremes (“App”, “Platform”, “Service”), you agree to these Terms &amp; Conditions. If you do not agree, please do not use the platform.</P>
              <P>These Terms apply to all users including:</P>
              <UL items={["Members", "Fitness enthusiasts", "Trainers", "Fitness Centres", "Nutrition professionals", "Social/community users"]} />

              <H3 id="t-2">2. Eligibility</H3>
              <P>You must be at least 18 years old or have parental/legal guardian consent to use FitExtremes. You agree to provide accurate information during registration.</P>

              <H3 id="t-3">3. Health &amp; Medical Disclaimer</H3>
              <P>FitExtremes provides fitness, wellness, nutrition, and workout-related information for educational and informational purposes only.</P>
              <P>FitExtremes:</P>
              <UL items={["is NOT a medical provider", "does NOT provide medical advice", "does NOT diagnose or treat medical conditions"]} />
              <P>Always consult a physician before starting exercise programs, diet plans, supplements, or wellness routines. You participate in workouts and fitness activities at your own risk.</P>

              <H3 id="t-4">4. User Accounts</H3>
              <P>You are responsible for maintaining account confidentiality, protecting your password, and all activities under your account.</P>
              <P>FitExtremes may suspend or terminate accounts that violate laws, abuse users, upload harmful content, or engage in fraud/spam.</P>

              <H3 id="t-5">5. User Content</H3>
              <P>You may upload workout data, photos, videos, comments, transformation images, fitness progress, and reviews. You retain ownership of your content.</P>
              <P>By uploading content, you grant FitExtremes a worldwide, non-exclusive license to display, host, distribute, and promote content within the platform.</P>
              <P>You agree not to upload illegal content, copyrighted material without permission, hate speech, explicit content, or harmful misinformation.</P>

              <H3 id="t-6">6. Fitness Centre &amp; Trainer Listings</H3>
              <P>Fitness Centres, trainers, and business users are responsible for ensuring business information is accurate, certifications/licenses are valid, and services comply with local laws. FitExtremes is not responsible for disputes between users and service providers.</P>

              <H3 id="t-7">7. Subscriptions &amp; Payments</H3>
              <P>Certain features may require payment or subscription. By purchasing a subscription, you agree that payment information is accurate, recurring billing may apply until cancelled, and fees may change with notice. All purchases are subject to applicable taxes. Refund policies may vary depending on platform rules (Apple App Store, Google Play, website subscriptions).</P>

              <H3 id="t-8">8. AI Features &amp; Recommendations</H3>
              <P>FitExtremes may provide AI-generated workout suggestions, meal recommendations, fitness insights, and chatbot support. AI-generated content may not always be accurate and should not replace professional advice.</P>

              <H3 id="t-9">9. Intellectual Property</H3>
              <P>All FitExtremes branding, logos, software, designs, and content are owned by FitExtremes unless otherwise stated. You may not copy, reverse engineer, resell, or redistribute platform content without permission.</P>

              <H3 id="t-10">10. Limitation of Liability</H3>
              <P>To the maximum extent permitted by law, FitExtremes shall not be liable for injuries, fitness-related incidents, data loss, business interruption, indirect damages, or third-party actions. Use of the platform is at your own risk.</P>

              <H3 id="t-11">11. Privacy</H3>
              <P>Your use of FitExtremes is also governed by our Privacy Policy.</P>

              <H3 id="t-12">12. Account Termination</H3>
              <P>We may suspend or terminate accounts for policy violations, fraudulent activity, abusive behavior, or security risks. Users may delete accounts at any time.</P>

              <H3 id="t-13">13. Changes to Terms</H3>
              <P>FitExtremes may update these Terms periodically. Continued use after updates means you accept the revised Terms.</P>

              <H3 id="t-14">14. Governing Law</H3>
              <P>These Terms shall be governed by the laws of Ontario, Canada, unless local consumer protection laws apply in your jurisdiction.</P>

              <H3 id="t-15">15. Contact Information</H3>
              <P>FitExtremes<br />Ontario, Canada<br />Email: info@fitextremes.com</P>
            </section>

            <section id="privacy" className="scroll-mt-28">
              <H2 id="privacy">Privacy Policy</H2>
              <p className="text-xs text-muted-foreground mb-6">for FitExtremes · Effective Date: May 19, 2026</p>

              <H3 id="p-1">1. Introduction</H3>
              <P>FitExtremes respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and protect your information.</P>

              <H3 id="p-2">2. Information We Collect</H3>
              <P><strong className="text-foreground">Account Information:</strong></P>
              <UL items={["Name", "Email address", "Phone number", "Username/password"]} />
              <P><strong className="text-foreground">Fitness Information:</strong></P>
              <UL items={["Workouts", "Fitness goals", "Weight", "Nutrition logs", "Activity tracking"]} />
              <P><strong className="text-foreground">Device Information:</strong></P>
              <UL items={["IP address", "Device type", "Browser/app version", "Operating system"]} />
              <P><strong className="text-foreground">Social Features:</strong></P>
              <UL items={["Comments", "Messages", "Uploaded photos/videos", "Community interactions"]} />

              <H3 id="p-3">3. How We Use Information</H3>
              <UL items={[
                "Provide app functionality",
                "Personalize fitness recommendations",
                "Improve user experience",
                "Process subscriptions/payments",
                "Send notifications",
                "Provide customer support",
                "Improve AI recommendations",
                "Maintain platform security",
              ]} />

              <H3 id="p-4">4. Legal Basis (Canada &amp; International)</H3>
              <P>Depending on your location, we process data based on user consent, contractual necessity, legitimate business interests, and legal obligations.</P>

              <H3 id="p-5">5. Sharing of Information</H3>
              <P>We do <strong className="text-foreground">NOT</strong> sell personal information. We may share data with payment processors, cloud hosting providers, analytics providers, customer support tools, and legal authorities when required.</P>

              <H3 id="p-6">6. Data Storage &amp; Security</H3>
              <P>We use reasonable administrative, technical, and organizational safeguards to protect data. However, no platform can guarantee 100% security.</P>

              <H3 id="p-7">7. International Users</H3>
              <P>Your information may be stored or processed in Canada, the United States, or other countries where service providers operate. By using FitExtremes, you consent to such transfers where permitted by law.</P>

              <H3 id="p-8">8. Cookies &amp; Analytics</H3>
              <P>FitExtremes may use cookies, analytics tools, and tracking technologies to help improve performance, personalization, and advertising effectiveness. Users may disable cookies through browser settings.</P>

              <H3 id="p-9">9. Your Rights</H3>
              <P>Depending on your jurisdiction, you may have rights to access your data, correct information, delete your account, withdraw consent, or request data portability. Requests can be sent to info@fitextremes.com.</P>

              <H3 id="p-10">10. Data Retention</H3>
              <P>We retain information as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.</P>

              <H3 id="p-11">11. Children's Privacy</H3>
              <P>FitExtremes is not intended for children under 13 without parental consent. If we learn that unauthorized child data has been collected, we will remove it.</P>

              <H3 id="p-12">12. Third-Party Services</H3>
              <P>FitExtremes may contain links or integrations with third-party platforms including Apple Health, Google Fit, Stripe, and social media platforms. We are not responsible for third-party privacy practices.</P>

              <H3 id="p-13">13. Changes to This Policy</H3>
              <P>We may update this Privacy Policy periodically. Updated versions will be posted within the app or website.</P>

              <H3 id="p-14">14. Contact Us</H3>
              <P>FitExtremes<br />Ontario, Canada<br />Email: info@fitextremes.com</P>
            </section>

            <section id="additions" className="scroll-mt-28">
              <H2 id="additions">Recommended Additions</H2>
              <P>As FitExtremes grows, we will add:</P>
              <UL items={[
                "Cookie Policy",
                "Community Guidelines",
                "Trainer / Fitness Centre Agreement",
                "Refund Policy",
                "AI Disclaimer",
                "Health Disclaimer",
                "GDPR Compliance Notice",
                "Accessibility Statement",
              ]} />
            </section>

            <section id="appstore" className="scroll-mt-28">
              <H2 id="appstore">App Store Compliance</H2>
              <P>For Apple App Store and Google Play Store, FitExtremes provides:</P>
              <UL items={[
                "Privacy Policy URL",
                "Terms URL",
                "Account deletion option",
                "Contact email",
                "Clear subscription disclosure",
              ]} />
            </section>
          </article>
        </div>
      </main>

      <Footer hidePlatform hideForPros />
    </div>
  );
};

export default Legal;

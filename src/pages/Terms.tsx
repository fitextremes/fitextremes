import Navbar from "@/components/Navbar";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar minimal />
    <main className="mx-auto max-w-3xl px-4 pt-24 pb-16 text-foreground">
      <h1 className="font-display text-3xl uppercase tracking-wider mb-6">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground mb-4">Version v1.0 — Effective May 20, 2026</p>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Welcome to FitExtremes. By creating an account or using our services, you agree to these Terms & Conditions.</p>
        <h2 className="text-foreground font-semibold mt-6">1. Accounts</h2>
        <p>You are responsible for your account credentials and all activity under your account.</p>
        <h2 className="text-foreground font-semibold mt-6">2. Acceptable Use</h2>
        <p>You agree not to misuse the platform, post unlawful content, or infringe on the rights of others.</p>
        <h2 className="text-foreground font-semibold mt-6">3. Subscriptions</h2>
        <p>Paid plans (Trainer, Business) renew automatically until cancelled. Trials convert to paid unless cancelled before the trial ends.</p>
        <h2 className="text-foreground font-semibold mt-6">4. Liability</h2>
        <p>FitExtremes provides services "as is". Fitness, nutrition, and trainer content is informational and not medical advice.</p>
        <h2 className="text-foreground font-semibold mt-6">5. Contact</h2>
        <p>Questions? Reach us at support@fitextremes.com.</p>
      </div>
    </main>
  </div>
);

export default Terms;

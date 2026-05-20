import Navbar from "@/components/Navbar";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar minimal />
    <main className="mx-auto max-w-3xl px-4 pt-24 pb-16 text-foreground">
      <h1 className="font-display text-3xl uppercase tracking-wider mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-4">Version v1.0 — Effective May 20, 2026</p>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>FitExtremes (“we”, “us”) respects your privacy. This Policy explains what we collect and how we use it. We comply with PIPEDA and applicable Ontario privacy laws, and we are built with GDPR-ready practices.</p>
        <h2 className="text-foreground font-semibold mt-6">1. Information We Collect</h2>
        <p>Account info (name, email, username), profile content, payment metadata (via Stripe), and usage analytics.</p>
        <h2 className="text-foreground font-semibold mt-6">2. How We Use It</h2>
        <p>To provide the service, process payments, send notifications, and improve the platform.</p>
        <h2 className="text-foreground font-semibold mt-6">3. Sharing</h2>
        <p>We share data only with service providers (e.g. Stripe, infrastructure) and never sell personal data.</p>
        <h2 className="text-foreground font-semibold mt-6">4. Your Rights</h2>
        <p>You can request access, correction, or deletion of your data at any time by contacting privacy@fitextremes.com.</p>
        <h2 className="text-foreground font-semibold mt-6">5. Retention</h2>
        <p>We keep data for as long as your account is active or as required by law.</p>
      </div>
    </main>
  </div>
);

export default Privacy;

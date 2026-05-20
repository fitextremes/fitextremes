import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CONTACT_EMAIL = "info@fitextremes.com";

export default function ContactUs() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex flex-col items-center justify-center px-4 py-24 sm:py-32">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>

          <h1 className="font-display text-3xl uppercase tracking-wider text-foreground sm:text-4xl">
            Contact Us
          </h1>

          <p className="mt-4 text-muted-foreground">
            Need help or have questions about FitExtremes?
          </p>

          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Please contact us at:</p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block font-display text-xl uppercase tracking-wide text-primary transition-colors hover:text-primary/80 sm:text-2xl"
              aria-label={`Send email to ${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
                aria-label="Copy email address"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy Email"}
              </Button>

              <Button
                variant="default"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  aria-label="Open default email application"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Send Email
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-10">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

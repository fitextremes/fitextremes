import { isPaymentsTestMode } from "@/lib/stripe";
import { BILLING_ENABLED } from "@/config/billing";

export function PaymentTestModeBanner() {
  if (!BILLING_ENABLED) return null;
  if (!isPaymentsTestMode()) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      Payments are currently running in test mode. No real charges will be made.
    </div>
  );
}

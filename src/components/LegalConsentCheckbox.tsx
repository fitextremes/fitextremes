import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

export const LEGAL_CONSENT_VERSION = "v1.0";

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id?: string;
}

export const LegalConsentCheckbox = ({ checked, onChange, error, id = "legal-consent" }: LegalConsentCheckboxProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="flex items-start gap-2 cursor-pointer select-none">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-0.5"
      />
      <span className="text-xs text-muted-foreground leading-relaxed">
        I agree to the{" "}
        <Link to="/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Terms Conditions &amp; Privacy Policies
        </Link>
        .
      </span>
    </label>
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>
    )}
  </div>
);

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BusinessDashboard from "./BusinessDashboard";

let businessType = "supplement_store";

vi.mock("@/components/SocialTopBar", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "business-account" }, loading: false }),
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ isBusiness: true, loading: false }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    data: {
      full_name: businessType === "gym" ? "Test Fitness Centre" : "Test Supplement Store",
      username: "test_business",
      business_type: businessType,
      is_suspended: false,
    },
  }),
}));

vi.mock("@/hooks/useBusiness", () => ({
  useBusinessStats: () => ({ data: {} }),
  useBusinessLeads: () => ({ data: [] }),
  useUpdateLeadStatus: () => ({ mutateAsync: vi.fn() }),
}));

const forbiddenSubscriptionCopy = [
  "Subscription",
  "Business Plan",
  "Free Trial",
  "$30 CAD/month",
  "Subscribe Now",
];

const renderDashboard = () => render(
  <MemoryRouter>
    <BusinessDashboard />
  </MemoryRouter>,
);

afterEach(cleanup);

describe.each([
  ["Supplement Store", "supplement_store"],
  ["Fitness Centre", "gym"],
])("%s business dashboard", (label, type) => {
  it("renders profile, analytics, and leads with no subscription panel", () => {
    businessType = type;
    renderDashboard();

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage photos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view public profile/i })).toBeInTheDocument();
    expect(screen.getByText("Profile Views")).toBeInTheDocument();
    expect(screen.getByText("Click to Call")).toBeInTheDocument();
    expect(screen.getByText("Website Clicks")).toBeInTheDocument();
    expect(screen.getByText("Delivery Requests")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leads" })).toBeInTheDocument();

    for (const text of forbiddenSubscriptionCopy) {
      expect(screen.queryByText(new RegExp(text.replace("$", "\\$"), "i"))).not.toBeInTheDocument();
    }
  });
});
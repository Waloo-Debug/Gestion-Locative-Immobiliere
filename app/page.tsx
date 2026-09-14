import { LandingPage } from "@/components/landing/LandingPage";

/** Guests see the marketing page; logged-in users are redirected to /dashboard by middleware. */
export default function HomePage() {
  return <LandingPage />;
}

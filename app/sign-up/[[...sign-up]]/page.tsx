import { SignUp } from "@clerk/nextjs";
import { LandingPageHeader } from "@/components/landing-page-header";

export default function SignUpPage() {
  return (
    <main className="landing-page">
      <LandingPageHeader />

      <div className="landing-shell">
        <section className="auth-shell auth-shell-plain">
          <SignUp />
        </section>
      </div>
    </main>
  );
}

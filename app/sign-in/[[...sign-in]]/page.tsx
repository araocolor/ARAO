import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="page stack">
      <section className="section stack">
        <p className="muted">Authentication</p>
        <SignIn />
      </section>
    </main>
  );
}

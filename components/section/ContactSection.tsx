import { SignUp } from "@clerk/nextjs";
import { useReveal } from "@/hooks/useReveal";

export default function ContactSection() {
  const { ref, isVisible } = useReveal(0.3);
  return (
    <section
      className="flex h-screen w-screen shrink-0 snap-start items-center px-4 pt-20 md:px-12 md:pt-0 lg:px-16"
      ref={ref}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-16 lg:gap-24">
          <div className="flex flex-col justify-center">
            <div
              className={`mb-6 transition-all duration-700 md:mb-12 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-12 opacity-0"
              }`}
            >
              <h2 className="mb-2 font-light font-sans text-4xl text-foreground leading-[1.05] tracking-tight md:mb-3 md:text-7xl lg:text-8xl">
                Launch your
                <br />
                workspace
              </h2>
              <p className="font-mono text-foreground/60 text-xs md:text-base">
                / Create an account to access the dashboard
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <SignUp forceRedirectUrl="/dashboard" routing="hash" />
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import MagneticButton from "@/components/magneticButton";
import { useReveal } from "@/hooks/useReveal";

export default function AboutSection({
  scrollToSection,
}: {
  scrollToSection?: (index: number) => void;
}) {
  const { ref, isVisible } = useReveal(0.3);

  return (
    <section
      className="flex h-screen w-screen shrink-0 snap-start items-center px-4 pt-20 md:px-12 md:pt-0 lg:px-16"
      ref={ref}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Left side - Story */}
          <div>
            <div
              className={`mb-6 transition-all duration-700 md:mb-12 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-12 opacity-0"
              }`}
            >
              <h2 className="mb-3 font-light font-sans text-3xl text-foreground leading-[1.1] tracking-tight md:mb-4 md:text-6xl lg:text-7xl">
                Building the
                <br />
                future of
                <br />
                <span className="text-foreground/40">AI research ops</span>
              </h2>
            </div>

            <div
              className={`space-y-3 transition-all duration-700 md:space-y-4 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              } delay-[200ms]`}
            >
              <p className="max-w-md text-foreground/90 text-sm leading-relaxed md:text-lg">
                Page Mind is focused on the workflows behind great
                answers—streaming transcripts, durable storage, and the controls
                teams need to keep research organised.
              </p>
              <p className="max-w-md text-foreground/90 text-sm leading-relaxed md:text-lg">
                From instant session recovery to audit-ready usage metrics,
                every feature is built to help analysts, founders, and operators
                trust their AI copilots.
              </p>
            </div>
          </div>

          {/* Right side - Stats with creative layout */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-12">
            {[
              {
                value: "<1s",
                label: "Stream start",
                sublabel: "Median time to first token",
                direction: "right",
              },
              {
                value: "100%",
                label: "Session recall",
                sublabel: "Chats synced to MongoDB",
                direction: "left",
              },
              {
                value: "4",
                label: "Key controls",
                sublabel: "Add, update, clear, fallback",
                direction: "right",
              },
            ].map((stat, i) => {
              const delayClass =
                ["delay-300", "delay-[450ms]", "delay-[600ms]"][i] ?? "";
              const alignmentClass =
                i % 2 === 0 ? "max-w-full" : "ml-auto max-w-[85%]";
              const getRevealClass = () => {
                if (!isVisible) {
                  return stat.direction === "left"
                    ? "-translate-x-16 opacity-0"
                    : "translate-x-16 opacity-0";
                }
                return "translate-x-0 opacity-100";
              };

              return (
                <div
                  className={`flex items-baseline gap-4 border-foreground/30 border-l pl-4 transition-all duration-700 md:gap-8 md:pl-8 ${getRevealClass()} ${delayClass} ${alignmentClass}`}
                  key={stat.label}
                >
                  <div className="font-light text-3xl text-foreground md:text-6xl lg:text-7xl">
                    {stat.value}
                  </div>
                  <div>
                    <div className="font-light font-sans text-base text-foreground md:text-xl">
                      {stat.label}
                    </div>
                    <div className="font-mono text-foreground/60 text-xs">
                      {stat.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 md:mt-16 md:gap-4 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          } delay-[750ms]`}
        >
          <MagneticButton
            onClick={() => scrollToSection?.(4)}
            size="lg"
            variant="primary"
          >
            Start a Project
          </MagneticButton>
          <MagneticButton
            onClick={() => scrollToSection?.(1)}
            size="lg"
            variant="secondary"
          >
            View Our Work
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

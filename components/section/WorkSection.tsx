"use client";

import { useReveal } from "@/hooks/useReveal";

export default function WorkSection() {
  const { ref, isVisible } = useReveal(0.3);
  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-6 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-12 transition-all duration-700 md:mb-16 ${
            isVisible
              ? "translate-x-0 opacity-100"
              : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Session highlights
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / What teams see inside the dashboard
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          {[
            {
              number: "01",
              title: "Persistent timelines",
              category: "Auto-sync your entire conversation history with MongoDB",
              year: "Live",
              direction: "left",
            },
            {
              number: "02",
              title: "One-click session control",
              category: "Rename or delete threads without breaking streaming replies",
              year: "Live",
              direction: "right",
            },
            {
              number: "03",
              title: "Usage metadata",
              category: "Surface tokens, duration, key provenance, and source counts instantly",
              year: "New",
              direction: "left",
            },
          ].map((project, i) => (
            <ProjectCard
              key={i}
              project={project}
              index={i}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  isVisible,
}: {
  project: {
    number: string;
    title: string;
    category: string;
    year: string;
    direction: string;
  };
  index: number;
  isVisible: boolean;
}) {
  const delayClass = ["delay-0", "delay-[150ms]", "delay-[300ms]"][index] ?? "";
  const sizeClass = index % 2 === 0 ? "max-w-[85%]" : "ml-auto max-w-[90%]";
  const getRevealClass = () => {
    if (!isVisible) {
      return project.direction === "left"
        ? "-translate-x-16 opacity-0"
        : "translate-x-16 opacity-0";
    }
    return "translate-x-0 opacity-100";
  };

  return (
    <div
      className={`group flex items-center justify-between border-b border-foreground/10 py-6 transition-all duration-700 hover:border-foreground/20 md:py-8 ${getRevealClass()} ${delayClass} ${sizeClass}`}
    >
      <div className="flex items-baseline gap-4 md:gap-8">
        <span className="font-mono text-sm text-foreground/30 transition-colors group-hover:text-foreground/50 md:text-base">
          {project.number}
        </span>
        <div>
          <h3 className="mb-1 font-sans text-2xl font-light text-foreground transition-transform duration-300 group-hover:translate-x-2 md:text-3xl lg:text-4xl">
            {project.title}
          </h3>
          <p className="font-mono text-xs text-foreground/50 md:text-sm">
            {project.category}
          </p>
        </div>
      </div>
      <span className="font-mono text-xs text-foreground/30 md:text-sm">
        {project.year}
      </span>
    </div>
  );
}

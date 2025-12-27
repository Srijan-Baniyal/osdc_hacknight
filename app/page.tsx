"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChromaFlow, Shader, Swirl } from "shaders/react";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import MagneticButton from "@/components/MagneticButton";
import AboutSection from "@/components/section/AboutSection";
import ContactSection from "@/components/section/ContactSection";
import ServicesSection from "@/components/section/ServiceSection";
import WorkSection from "@/components/section/WorkSection";
import { Button } from "@/components/ui/button";

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const shaderContainerRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<number | null>(null);

  useEffect(() => {
    const checkShaderReady = () => {
      if (shaderContainerRef.current) {
        const canvas = shaderContainerRef.current.querySelector("canvas");
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          setIsLoaded(true);
          return true;
        }
      }
      return false;
    };

    if (checkShaderReady()) {
      return;
    }

    const intervalId = setInterval(() => {
      if (checkShaderReady()) {
        clearInterval(intervalId);
      }
    }, 100);

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const scrollToSection = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const sectionWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: sectionWidth * index,
        behavior: "smooth",
      });
      setCurrentSection(index);
    }
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - touchStartY.current) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchStartY.current - touchEndY;
      const deltaX = touchStartX.current - touchEndX;

      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentSection < 4) {
          scrollToSection(currentSection + 1);
        } else if (deltaY < 0 && currentSection > 0) {
          scrollToSection(currentSection - 1);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [currentSection, scrollToSection]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();

        if (!scrollContainerRef.current) {
          return;
        }

        scrollContainerRef.current.scrollBy({
          left: e.deltaY,
          behavior: "instant",
        });

        const sectionWidth = scrollContainerRef.current.offsetWidth;
        const newSection = Math.round(
          scrollContainerRef.current.scrollLeft / sectionWidth
        );
        if (newSection !== currentSection) {
          setCurrentSection(newSection);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [currentSection]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollThrottleRef.current !== null) {
        return;
      }

      scrollThrottleRef.current = requestAnimationFrame(() => {
        if (!scrollContainerRef.current) {
          scrollThrottleRef.current = null;
          return;
        }

        const sectionWidth = scrollContainerRef.current.offsetWidth;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const newSection = Math.round(scrollLeft / sectionWidth);

        if (
          newSection !== currentSection &&
          newSection >= 0 &&
          newSection <= 4
        ) {
          setCurrentSection(newSection);
        }

        scrollThrottleRef.current = null;
      });
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (scrollThrottleRef.current !== null) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
    };
  }, [currentSection]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <CustomCursor />
      <GrainOverlay />
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-700 contain-strict ${isLoaded ? "opacity-100" : "opacity-0"}`}
        ref={shaderContainerRef}
      >
        <Shader className="h-full w-full">
          <Swirl
            blend={50}
            coarseX={40}
            coarseY={40}
            colorA="#1275d8"
            colorB="#e19136"
            detail={0.8}
            fineX={40}
            fineY={40}
            mediumX={40}
            mediumY={40}
            speed={0.8}
          />
          <ChromaFlow
            baseColor="#0066ff"
            downColor="#d1d1d1"
            intensity={0.9}
            leftColor="#e19136"
            maskType="alpha"
            momentum={25}
            opacity={0.97}
            radius={1.8}
            rightColor="#e19136"
            upColor="#0066ff"
          />
        </Shader>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <nav
        className={`fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-6 transition-opacity duration-700 md:px-12 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <Button
          className="flex items-center gap-2 bg-transparent transition-transform hover:scale-105 hover:bg-transparent"
          onClick={() => scrollToSection(0)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/15 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-foreground/25">
            <span className="font-bold font-sans text-foreground text-xl">
              A
            </span>
          </div>
          <span className="bg-transparent font-sans font-semibold text-foreground text-xl tracking-tight">
            Page Mind
          </span>
        </Button>

        <div className="hidden items-center gap-8 md:flex">
          {[
            "Overview",
            "Sessions",
            "Capabilities",
            "Why Page Mind",
            "Sign Up",
          ].map((item, index) => (
            <Button
              className={`group relative bg-transparent font-medium font-sans text-sm transition-colors ${
                currentSection === index
                  ? "text-foreground/80 hover:bg-transparent"
                  : "text-foreground/80 hover:bg-transparent"
              }`}
              key={item}
              onClick={() => scrollToSection(index)}
            >
              {item}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-foreground transition-all duration-300 ${
                  currentSection === index ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Button>
          ))}
        </div>

        <MagneticButton onClick={() => scrollToSection(4)} variant="secondary">
          Get Started
        </MagneticButton>
      </nav>

      <div
        className={`scrollbar-none relative z-10 flex h-screen overflow-x-auto overflow-y-hidden transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        data-scroll-container
        ref={scrollContainerRef}
      >
        {/* Hero Section */}
        <section className="flex min-h-screen w-screen shrink-0 flex-col justify-end px-6 pt-24 pb-16 md:px-12 md:pb-24">
          <div className="max-w-3xl">
            <div className="fade-in slide-in-from-bottom-4 mb-4 inline-block animate-in rounded-full border border-foreground/20 bg-foreground/15 px-4 py-1.5 backdrop-blur-md duration-700">
              <p className="font-mono text-foreground/90 text-xs">
                Perplexity-powered research workspace
              </p>
            </div>
            <h1 className="fade-in slide-in-from-bottom-8 mb-6 animate-in font-light font-sans text-6xl text-foreground leading-[1.1] tracking-tight duration-1000 md:text-7xl lg:text-8xl">
              <span className="text-balance">
                Collaborative research that
                <br />
                remembers every insight
              </span>
            </h1>
            <p className="fade-in slide-in-from-bottom-4 mb-8 max-w-xl animate-in text-foreground/90 text-lg leading-relaxed delay-200 duration-1000 md:text-xl">
              <span className="text-pretty">
                Spin up a shared Perplexity workspace with streaming responses,
                session history, rename and delete controls, bring-your-own-key
                support, and realtime usage analytics for every answer.
              </span>
            </p>
            <div className="fade-in slide-in-from-bottom-4 flex animate-in flex-col gap-4 delay-300 duration-1000 sm:flex-row sm:items-center">
              <MagneticButton
                onClick={() => scrollToSection(4)}
                size="lg"
                variant="primary"
              >
                Open dashboard
              </MagneticButton>
              <MagneticButton
                onClick={() => scrollToSection(1)}
                size="lg"
                variant="secondary"
              >
                Explore features
              </MagneticButton>
            </div>
          </div>

          <div className="fade-in absolute bottom-8 left-1/2 -translate-x-1/2 animate-in delay-500 duration-1000">
            <div className="flex items-center gap-2">
              <p className="font-mono text-foreground/80 text-xs">
                Scroll sideways to tour the platform
              </p>
              <div className="flex h-6 w-12 items-center justify-center rounded-full border border-foreground/20 bg-foreground/15 backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/80" />
              </div>
            </div>
          </div>
        </section>

        <WorkSection />
        <ServicesSection />
        <AboutSection scrollToSection={scrollToSection} />
        <ContactSection />
      </div>

      <style global jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}

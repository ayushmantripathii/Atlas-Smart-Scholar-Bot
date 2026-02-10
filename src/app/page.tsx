import Link from "next/link";
import {
  Brain,
  FileText,
  Lightbulb,
  Sparkles,
  BookOpen,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Smart Summaries",
    description: "Upload PDFs or notes and get AI-powered summaries instantly.",
  },
  {
    icon: Brain,
    title: "Quiz Generator",
    description:
      "Auto-generate MCQs and practice tests from your study material.",
  },
  {
    icon: Lightbulb,
    title: "Flashcards",
    description: "Create intelligent flashcards for rapid memorization.",
  },
  {
    icon: Sparkles,
    title: "Study Plans",
    description:
      "Get personalized study plans based on your material and goals.",
  },
  {
    icon: BarChart3,
    title: "Exam Analysis",
    description: "Detect repeated topics and patterns from past papers.",
  },
  {
    icon: BookOpen,
    title: "Revision Mode",
    description: "Condensed recap sessions to solidify your understanding.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-neon-glow flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Atlas</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="neon" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-sm mb-8 animate-glow-pulse">
              <Sparkles className="h-4 w-4" />
              AI-Powered Study Assistant
            </div>

            {/* Heading */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Study Smarter with</span>
              <br />
              <span className="gradient-text">Atlas</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mb-10">
              Turning curiosity into clarity. Upload your study material and let
              AI transform it into summaries, quizzes, flashcards, and
              personalized study plans.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-neon-glow text-white hover:opacity-90 shadow-neon-cyan text-lg px-8 h-12"
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 h-12 border-border/60"
                >
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Trust indicator */}
            <div className="flex items-center gap-2 mt-8 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-neon-green" />
              Secure & Private — Your data stays yours
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">ace your exams</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful AI tools designed to help you study more effectively and
              retain knowledge longer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-neon-cyan/30 hover:shadow-neon-cyan transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-neon-cyan/10 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-neon-cyan" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-neon-glow opacity-10" />
            <div className="relative p-12 lg:p-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to transform your study sessions?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students using Atlas to study smarter, not
                harder.
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-neon-glow text-white hover:opacity-90 shadow-neon-cyan text-lg px-8 h-12"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-neon-glow flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium gradient-text">Atlas</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Atlas — Smart Scholar Bot. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

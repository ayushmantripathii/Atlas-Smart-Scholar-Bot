import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Atlas",
  description: "Sign in to your Atlas account to access your study tools.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/3 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {children}
      </div>
    </div>
  );
}

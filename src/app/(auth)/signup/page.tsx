import { SignupForm } from "@/components/auth/SignupForm";
import { Metadata } from "next";
import Link from "next/link";
import { TaskStackLogo } from "@/components/ui/TaskStackLogo";

export const metadata: Metadata = {
  title: "Sign Up — TaskStack",
  description: "Create your free TaskStack account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-16 w-96 h-96 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute bottom-1/4 -left-16 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex justify-center">
        <Link href="/">
          <TaskStackLogo size={40} />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        <SignupForm />
      </div>
    </div>
  );
}

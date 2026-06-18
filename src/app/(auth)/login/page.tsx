import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Login - TaskShift",
  description: "Sign in to your TaskShift account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex justify-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-700 transition-colors">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskShift</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        <LoginForm />
      </div>
    </div>
  );
}

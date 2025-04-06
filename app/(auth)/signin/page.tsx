"use client";

import BackgroundAuth from "@/components/BackgroundAuth";
import FooterAuth from "@/components/FooterAuth";
import NavbarAuth from "@/components/NavbarAuth";
import { Button } from "@/components/ui/button";
import { GanttChart, Loader } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignInPage() {

 const searchParams = useSearchParams();
 const error = searchParams.get("error"); // Get error from URL
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null);

 useEffect(() => {
   if (error) {
     setErrorMessage(decodeURIComponent(error)); // Decode error message from URL
   }
 }, [error]);

 const handleCredentialLogin = async (e: React.FormEvent<HTMLFormElement>) => {
   e.preventDefault();
   setLoading(true)
   setErrorMessage(null); // Reset error message before attempting login

   const formData = new FormData(e.currentTarget);
   const email = formData.get("email");
   const password = formData.get("password");

   const res = await signIn("credentials", {
     email,
     password,
     redirect: false, // Prevents automatic redirection
   });

   setLoading(false)

   if (res?.error) {
     setErrorMessage(res.error); // Set error message dynamically
   } else if (res?.ok) {
     setSuccess("Login successful! Redirecting...");
     setTimeout(()=>{window.location.href = "/dashboard"; }, 2000); 
   }
 };


  return (
    <main className="min-h-screen relative flex flex-col">
      <BackgroundAuth />

      <NavbarAuth type="signin" />

      {/* Sign-In Form */}
      <div className="relative z-10 flex flex-1 justify-center items-center px-6 py-12">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl w-full max-w-md shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-rose-100 mb-6">
            Sign in to HypeQueue
          </h2>

          {errorMessage && (
            <p className="text-red-500 text-sm text-center mb-4">
              {errorMessage}
            </p>
          )}

          {success && (
            <p className="text-green-700 text-sm text-center mb-4">{success}</p>
          )}

          <form className="space-y-4" onSubmit={handleCredentialLogin}>
            <div>
              <label className="block text-zinc-300/80 text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300/80 text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600 transition-all border-0"
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5 text-white" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Google Sign-In Button */}

          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mt-4 w-full flex items-center justify-center space-x-3 px-6 py-2 
             bg-gradient-to-r from-rose-500 to-purple-500 text-white 
             rounded-lg hover:from-rose-600 hover:to-purple-600 
             transition-all shadow-md"
          >
            <GanttChart className="h-5 w-5 text-white" />
            <span>Sign in with Google</span>
          </Button>

          <p className="text-center text-sm text-zinc-400 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-rose-400 hover:text-rose-300">
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      <FooterAuth />
    </main>
  );
}



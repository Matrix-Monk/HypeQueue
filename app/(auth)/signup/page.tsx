"use client";

import FooterAuth from "@/components/FooterAuth";
import NavbarAuth from "@/components/NavbarAuth";
import { Button } from "@/components/ui/button";
import { GanttChart, Loader } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function SignUpPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error"); // Get error from URL
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (error) {
      setErrorMessage(decodeURIComponent(error)); // Decode error message from URL
    }
  }, [error]);

  const handleCredentialSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null); // Reset error message before attempting login


    setLoading(true)

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });



    const data = await res.json();

    setLoading(false)

    console.log("Signup Response:", data);

    function redirectToSignIn() {
      setLoading(false);
      router.push("/signin");
    }

    if (res.status === 409) {
      setLoading(true);
      setErrorMessage(data.error); // Show error message
      setTimeout(redirectToSignIn, 2000); // Redirect after 2 seconds
      return;
    }

    if (!res.ok) {
      setErrorMessage(data.error || "Failed to register user");
      return;
    }

    
    setLoading(true);

    setSuccess("Registration successful! Redirecting to sign-in...");

    setTimeout(redirectToSignIn, 2000); // Redirect to sign-in after success
  };

  return (
    <main className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3) blur(2px)",
        }}
      />

      {/* Navbar */}
      <NavbarAuth type="signup" />

      {/* Sign-Up Form */}
      <div className="relative z-10 flex flex-1 justify-center items-center px-6 py-12">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl w-full max-w-md shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-rose-100 mb-6">
            Register to HypeQueue
          </h2>

          {errorMessage && (
            <p className="text-red-500 text-sm text-center mb-4">
              {errorMessage}
            </p>
          )}

          {success && (
            <p className="text-green-700 text-sm text-center mb-4">{success}</p>
          )}

          <form className="space-y-4" onSubmit={handleCredentialSignup}>
            <div>
              <label className="block text-zinc-300/80 text-sm mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

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
                "Register"
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
            <span>Register with Google</span>
          </Button>

          <p className="text-center text-sm text-zinc-400 mt-4">
            Already have an account?{" "}
            <Link href="/signin" className="text-rose-400 hover:text-rose-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <FooterAuth />
    </main>
  );
}








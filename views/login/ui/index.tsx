"use client";

import { useState } from "react";
import { signIn } from "@/shared/lib/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "kakao",
      });
    } catch (error) {
      console.error("Error logging in with Kakao:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating word bubbles for background decoration
  const learningWords = [
    {
      word: "Hello",
      x: "10%",
      y: "15%",
      delay: "0s",
      duration: "20s",
      fontSize: "2.8rem",
    },
    {
      word: "Learn",
      x: "75%",
      y: "25%",
      delay: "2s",
      duration: "25s",
      fontSize: "1.7rem",
    },
    {
      word: "Speak",
      x: "20%",
      y: "70%",
      delay: "4s",
      duration: "22s",
      fontSize: "2.3rem",
    },
    {
      word: "Fluent",
      x: "80%",
      y: "60%",
      delay: "1s",
      duration: "28s",
      fontSize: "3.3rem",
    },
    {
      word: "Study",
      x: "15%",
      y: "45%",
      delay: "3s",
      duration: "24s",
      fontSize: "2.5rem",
    },
    {
      word: "Practice",
      x: "70%",
      y: "80%",
      delay: "5s",
      duration: "26s",
      fontSize: "1.6rem",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Animated background word bubbles */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {learningWords.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float select-none font-bold text-purple-800/30"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: item.delay,
              animationDuration: item.duration,
              fontSize: item.fontSize,
            }}
          >
            {item.word}
          </div>
        ))}
      </div>

      {/* Main content container */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            {/* Left side - Branding & messaging */}
            <div className="flex flex-col justify-center space-y-8 animate-slide-in-left">
              {/* Logo/Brand area */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/60 px-5 py-2 shadow-sm backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-purple-900">Study English</span>
                </div>

                <h1 className="font-sans text-5xl font-bold leading-tight tracking-tight text-purple-950 sm:text-6xl lg:text-7xl">
                  Master English,
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    Your Way
                  </span>
                </h1>

                <p className="max-w-md text-lg leading-relaxed text-purple-800/80 sm:text-xl">
                  Join thousands of learners on a personalized journey to English fluency. Interactive lessons, real
                  conversations, lasting results.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    ),
                    text: "Interactive Learning",
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    text: "Track Progress",
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    text: "Learn Anytime",
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    ),
                    text: "Join Community",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-white/40 px-4 py-3 backdrop-blur-sm transition-all hover:bg-white/60"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-purple-600">{feature.icon}</div>
                    <span className="text-sm font-medium text-purple-900">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Login card */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md animate-slide-in-right">
                <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-purple-900/10">
                  {/* Card header with decorative element */}
                  <div className="relative bg-gradient-to-br from-purple-600 to-violet-600 px-8 py-12">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-white/10 blur-xl"></div>

                    <div className="relative">
                      <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                      <p className="mt-2 text-purple-50">Continue your learning journey</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="space-y-6 px-8 py-10">
                    {/* Social login button */}
                    <button
                      onClick={handleKakaoLogin}
                      disabled={isLoading}
                      className="group relative w-full overflow-hidden rounded-xl bg-[#FEE500] px-6 py-4 font-medium text-[#000000] shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center gap-3">
                        {isLoading ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
                        ) : (
                          <>
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.545 1.574 4.778 4.01 6.164l-1.013 3.644c-.067.242.17.451.394.35l4.237-1.906C10.438 18.917 11.204 19 12 19c5.514 0 10-3.262 10-7.5S17.514 3 12 3z" />
                            </svg>
                            <span className="text-base">Continue with Kakao</span>
                          </>
                        )}
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
                    </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-purple-100"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-purple-400">Secure Sign In</span>
                      </div>
                    </div>

                    {/* Info text */}
                    <div className="rounded-lg bg-purple-50 px-4 py-3">
                      <p className="text-center text-sm text-purple-800">
                        By continuing, you agree to our{" "}
                        <a
                          href="#"
                          className="font-medium underline decoration-purple-300 underline-offset-2 hover:decoration-purple-500"
                        >
                          Terms
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="font-medium underline decoration-purple-300 underline-offset-2 hover:decoration-purple-500"
                        >
                          Privacy Policy
                        </a>
                      </p>
                    </div>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Secure</span>
                      </div>
                      <div className="h-4 w-px bg-purple-200"></div>
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Private</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-purple-800/70">
                    New to our platform?{" "}
                    <a
                      href="#"
                      className="font-semibold text-purple-700 underline decoration-purple-300 decoration-2 underline-offset-2 transition-colors hover:text-purple-900 hover:decoration-purple-500"
                    >
                      Create a free account
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

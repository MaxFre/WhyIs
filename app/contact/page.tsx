"use client";

import { useState } from "react";
import type { Metadata } from "next";

// Note: metadata can't be exported from a "use client" component,
// so we keep it in a wrapper — see layout or use a separate server component.

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    setStatus(res.ok ? "success" : "error");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold mb-2">Contact Us</h1>
      <p className="text-gray-400 mb-10">
        Have a question, feedback, or partnership inquiry? Fill in the form and we&apos;ll
        get back to you.
      </p>

      {status === "success" ? (
        <div className="rounded-2xl bg-green-900/30 border border-green-700 p-6 text-green-300">
          <p className="font-semibold text-lg mb-1">Message sent!</p>
          <p className="text-sm">Thanks for reaching out. We&apos;ll reply to your email shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
              placeholder="What's on your mind?"
            />
          </div>

          {status === "error" && (
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold transition-colors"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}

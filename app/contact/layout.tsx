import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | WhyIs",
  description: "Get in touch with the WhyIs team.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

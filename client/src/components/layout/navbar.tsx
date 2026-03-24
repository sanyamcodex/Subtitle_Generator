import Link from "next/link";
import { AudioLines } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
            <AudioLines className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">AI Subtitle Studio</p>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              CaptionForge
            </h1>
          </div>
        </Link>

        <nav className="hidden gap-6 md:flex">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Home
          </Link>
          <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
"use client";

import Link from "next/link";
import { Sparkles, Upload, Captions } from "lucide-react";
import { Button } from "../ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4" />
            Production-grade subtitle generator
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Turn videos into
            <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              {" "}clean subtitles
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
            Upload videos, generate subtitles, review timestamps, and export clean caption files with a premium creator-friendly workflow.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button className="w-48">
                <Upload className="mr-2 h-4 w-4" />
                Start Project
              </Button>
            </Link>
            <Button variant="secondary" className="w-48">
              <Captions className="mr-2 h-4 w-4" />
              See Workflow
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
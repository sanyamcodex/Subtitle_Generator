import { Card } from "../ui/card";
import { FileVideo, Clock3, Download, WandSparkles } from "lucide-react";

const features = [
  {
    icon: FileVideo,
    title: "Upload videos",
    description: "Drop MP4, MOV, and common video formats with a smooth UI.",
  },
  {
    icon: Clock3,
    title: "Track jobs",
    description: "Queued, processing, and completed states ready for scaling.",
  },
  {
    icon: WandSparkles,
    title: "Generate subtitles",
    description: "Backend ready for whisper-based subtitle generation.",
  },
  {
    icon: Download,
    title: "Export files",
    description: "SRT, VTT, TXT, and burned video support can plug in easily.",
  },
];

export function Features() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="p-6">
              <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
                <Icon className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-white">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                {item.description}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
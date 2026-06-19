import { Scissors, Mic, MicOff, Music2, Drum } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { useRebass } from "@/hooks/use-rebass";
import { cn } from "@/lib/utils";
import type { StemMode } from "@/lib/audio/types";

const MODES: {
  id: StemMode;
  label: string;
  icon: typeof Scissors;
  hint: string;
}[] = [
  { id: "full", label: "Full Mix", icon: Music2, hint: "Everything" },
  { id: "karaoke", label: "Karaoke", icon: MicOff, hint: "Remove vocals" },
  { id: "vocals", label: "Vocals", icon: Mic, hint: "Isolate voice" },
  { id: "bass", label: "Bass", icon: Music2, hint: "Low end only" },
  { id: "drums", label: "Drums", icon: Drum, hint: "Percussion" },
];

export const StemLabPanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Stem Lab" icon={Scissors}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Fast DSP separation (mid/side + filtering). Great for karaoke & bass
        checks — not full AI stems.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MODES.map((m) => {
          const active = settings.stemMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => updateSettings({ stemMode: m.id })}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-neon-violet bg-neon-violet/10 glow"
                  : "border-border bg-secondary/40 hover:border-neon-violet/50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-neon-violet" : "text-muted-foreground",
                )}
              />
              <span className="text-xs font-semibold">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {m.hint}
              </span>
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
};
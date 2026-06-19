import { Speaker } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { useRebass } from "@/hooks/use-rebass";
import { cn } from "@/lib/utils";
import { DEVICE_PROFILES } from "@/lib/audio/devices";

export const DeviceProfilePanel = () => {
  const { settings, updateSettings } = useRebass();
  return (
    <PanelCard title="Device Profile" icon={Speaker}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Voice the export for where it'll actually play. Preview + download both
        use this profile.
      </p>
      <div className="space-y-2">
        {DEVICE_PROFILES.map((d) => {
          const active = settings.deviceProfile === d.id;
          return (
            <button
              key={d.id}
              onClick={() => updateSettings({ deviceProfile: d.id })}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-neon bg-neon/10 glow-cyan"
                  : "border-border bg-secondary/40 hover:border-neon/50",
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold">{d.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {d.blurb}
                </p>
              </div>
              <span
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full border-2",
                  active
                    ? "border-neon bg-neon"
                    : "border-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
};
import { Music, X } from "lucide-react";
import { useRebass } from "@/hooks/use-rebass";
import { WaveformEditor } from "./WaveformEditor";
import { ZoomControl } from "./ZoomControl";
import { TransportBar } from "./TransportBar";
import { SpeedPitchPanel } from "./SpeedPitchPanel";
import { EqualizerPanel } from "./EqualizerPanel";
import { BassSpacePanel } from "./BassSpacePanel";
import { SpatialDynamicsPanel } from "./SpatialDynamicsPanel";
import { FadePanel } from "./FadePanel";
import { ActionBar } from "./ActionBar";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/audio/format";

export const Editor = () => {
  const { file, buffer, loadFile, stop } = useRebass();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-neon">
            <Music className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{file?.name}</p>
            <p className="text-xs text-muted-foreground">
              {buffer?.numberOfChannels === 1 ? "Mono" : "Stereo"} ·{" "}
              {buffer ? formatTime(buffer.duration) : "0:00"} ·{" "}
              {buffer?.sampleRate} Hz
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => {
            stop();
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "audio/*,video/*";
            input.onchange = () => {
              if (input.files?.[0]) loadFile(input.files[0]);
            };
            input.click();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/40 p-4">
        <WaveformEditor />
        <ZoomControl />
        <TransportBar />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpeedPitchPanel />
        <FadePanel />
        <div className="lg:col-span-2">
          <EqualizerPanel />
        </div>
        <BassSpacePanel />
        <SpatialDynamicsPanel />
      </div>

      <ActionBar />
    </div>
  );
};
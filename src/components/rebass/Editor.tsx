import { Music, X, Keyboard } from "lucide-react";
import { useRebass } from "@/hooks/use-rebass";
import { useKeyboardShortcuts } from "@/hooks/rebass/useKeyboardShortcuts";
import { WaveformEditor } from "./WaveformEditor";
import { ZoomControl } from "./ZoomControl";
import { TransportBar } from "./TransportBar";
import { PresetPanel } from "./PresetPanel";
import { StemLabPanel } from "./StemLabPanel";
import { DeviceProfilePanel } from "./DeviceProfilePanel";
import { SpeedPitchPanel } from "./SpeedPitchPanel";
import { EqualizerPanel } from "./EqualizerPanel";
import { BassSpacePanel } from "./BassSpacePanel";
import { SpatialDynamicsPanel } from "./SpatialDynamicsPanel";
import { FadePanel } from "./FadePanel";
import { LoudnessPanel } from "./LoudnessPanel";
import { SubSweepPanel } from "./SubSweepPanel";
import { ActionBar } from "./ActionBar";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/audio/format";

export const Editor = () => {
  const { file, buffer, loadFile, stop } = useRebass();
  useKeyboardShortcuts();

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 text-neon" /> Shortcuts:
          </span>
          <span>
            <kbd className="font-mono text-neon">Space</kbd> play
          </span>
          <span>
            <kbd className="font-mono text-neon">O</kbd> original
          </span>
          <span>
            <kbd className="font-mono text-neon">L</kbd> loop
          </span>
          <span>
            <kbd className="font-mono text-neon">D</kbd> download
          </span>
          <span>
            <kbd className="font-mono text-neon">S</kbd> share
          </span>
          <span>
            <kbd className="font-mono text-neon">←/→</kbd> trim start ·{" "}
            <kbd className="font-mono text-neon">Alt+←/→</kbd> trim end
          </span>
        </div>
      </div>

      <PresetPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StemLabPanel />
        <DeviceProfilePanel />
        <SpeedPitchPanel />
        <FadePanel />
        <div className="lg:col-span-2">
          <EqualizerPanel />
        </div>
        <BassSpacePanel />
        <SpatialDynamicsPanel />
        <LoudnessPanel />
        <SubSweepPanel />
      </div>

      <ActionBar />
    </div>
  );
};
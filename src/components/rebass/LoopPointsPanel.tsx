import { Repeat, Flag, PlayCircle } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRebass } from "@/hooks/use-rebass";
import { formatTime } from "@/lib/audio/format";

const parseTimeInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (trimmed.includes(":")) {
    const [minutesPart, secondsPart = "0"] = trimmed.split(":");
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
  }

  const seconds = Number(trimmed);
  return Number.isNaN(seconds) ? 0 : seconds;
};

export const LoopPointsPanel = () => {
  const {
    buffer,
    cropStart,
    cropEnd,
    playhead,
    loop,
    setLoop,
    setLoopPoints,
    setLoopStartFromPlayhead,
    setLoopEndFromPlayhead,
    preview,
  } = useRebass();

  const duration = buffer?.duration ?? 0;

  return (
    <PanelCard title="A/B Loop" icon={Repeat}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Set loop points by timestamp or from the waveform playhead, then loop that section.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">
            A / Loop start
          </label>
          <Input
            value={formatTime(cropStart)}
            onChange={(e) =>
              setLoopPoints(parseTimeInput(e.target.value), cropEnd)
            }
            className="h-10 rounded-xl bg-secondary/40 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">
            B / Loop end
          </label>
          <Input
            value={formatTime(cropEnd)}
            onChange={(e) =>
              setLoopPoints(cropStart, parseTimeInput(e.target.value))
            }
            className="h-10 rounded-xl bg-secondary/40 font-mono"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          className="h-10 rounded-xl"
          onClick={setLoopStartFromPlayhead}
        >
          <Flag className="mr-2 h-4 w-4" /> Set A from playhead
        </Button>
        <Button
          variant="secondary"
          className="h-10 rounded-xl"
          onClick={setLoopEndFromPlayhead}
        >
          <Flag className="mr-2 h-4 w-4" /> Set B from playhead
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setLoop(true);
            preview(false);
          }}
          className="h-10 rounded-xl bg-neon-violet text-primary-foreground hover:bg-neon-violet/90"
        >
          <PlayCircle className="mr-2 h-4 w-4" /> Preview A/B loop
        </Button>
        <Button
          variant={loop ? "default" : "secondary"}
          onClick={() => setLoop(!loop)}
          className="h-10 rounded-xl"
        >
          <Repeat className="mr-2 h-4 w-4" /> {loop ? "Loop on" : "Loop off"}
        </Button>
      </div>

      <div className="mt-3 rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        Current loop: <span className="font-mono text-neon">{formatTime(cropStart)}</span>{" "}
        → <span className="font-mono text-neon">{formatTime(cropEnd)}</span>{" "}
        <span className="text-muted-foreground/70">
          ({formatTime(Math.max(0, cropEnd - cropStart))})
        </span>
        {duration > 0 && (
          <span className="ml-2 text-muted-foreground/70">
            · playhead {formatTime(playhead)}
          </span>
        )}
      </div>
    </PanelCard>
  );
};
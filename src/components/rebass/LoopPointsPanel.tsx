import { Repeat, Flag, PlayCircle, Scissors, CornerDownRight } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    replaceStart,
    replaceEnd,
    appendLoopToEnd,
    setLoop,
    setLoopPoints,
    setLoopStartFromPlayhead,
    setLoopEndFromPlayhead,
    setReplaceRange,
    setReplaceStartFromPlayhead,
    setReplaceEndFromPlayhead,
    setAppendLoopToEnd,
    preview,
  } = useRebass();

  const duration = buffer?.duration ?? 0;

  return (
    <PanelCard title="A/B Loop" icon={Repeat}>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Set loop points by timestamp or from the waveform playhead, then optionally cut part of the original and append that loop to the end on export.
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

      <div className="mt-4 rounded-2xl border border-border bg-secondary/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold">Append loop to end on export</p>
            <p className="text-[11px] text-muted-foreground">
              Cuts a chosen section from the original, then places the A/B loop at the end.
            </p>
          </div>
          <Switch
            checked={appendLoopToEnd}
            onCheckedChange={setAppendLoopToEnd}
          />
        </div>

        {appendLoopToEnd && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Cut start
                </label>
                <Input
                  value={formatTime(replaceStart)}
                  onChange={(e) =>
                    setReplaceRange(parseTimeInput(e.target.value), replaceEnd)
                  }
                  className="h-10 rounded-xl bg-background/60 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Cut end
                </label>
                <Input
                  value={formatTime(replaceEnd)}
                  onChange={(e) =>
                    setReplaceRange(replaceStart, parseTimeInput(e.target.value))
                  }
                  className="h-10 rounded-xl bg-background/60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="h-10 rounded-xl"
                onClick={setReplaceStartFromPlayhead}
              >
                <Scissors className="mr-2 h-4 w-4" /> Set cut start
              </Button>
              <Button
                variant="secondary"
                className="h-10 rounded-xl"
                onClick={setReplaceEndFromPlayhead}
              >
                <Scissors className="mr-2 h-4 w-4" /> Set cut end
              </Button>
            </div>

            <div className="rounded-xl bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              Export flow: original before cut + original after cut + appended loop
            </div>
          </div>
        )}
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
        {appendLoopToEnd && (
          <div className="mt-2 flex items-center gap-2">
            <CornerDownRight className="h-3.5 w-3.5 text-neon" />
            <span>
              Cut <span className="font-mono text-neon">{formatTime(replaceStart)}</span> →{" "}
              <span className="font-mono text-neon">{formatTime(replaceEnd)}</span> and append loop
            </span>
          </div>
        )}
        {duration > 0 && (
          <span className="ml-2 text-muted-foreground/70">
            · playhead {formatTime(playhead)}
          </span>
        )}
      </div>
    </PanelCard>
  );
};
import { Play, Square, Repeat, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRebass } from "@/hooks/use-rebass";
import { formatTime } from "@/lib/audio/format";
import { cn } from "@/lib/utils";

export const TransportBar = () => {
  const {
    isPlaying,
    isOriginal,
    preview,
    stop,
    loop,
    setLoop,
    playhead,
    cropStart,
    cropEnd,
  } = useRebass();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => (isPlaying && !isOriginal ? stop() : preview(false))}
          className="h-10 rounded-xl bg-neon-violet text-primary-foreground hover:bg-neon-violet/90 glow"
        >
          {isPlaying && !isOriginal ? (
            <>
              <Square className="mr-2 h-4 w-4" /> Stop
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Preview
            </>
          )}
        </Button>
        <Button
          variant={isOriginal ? "default" : "secondary"}
          onClick={() => (isPlaying && isOriginal ? stop() : preview(true))}
          className={cn(
            "h-10 rounded-xl",
            isOriginal && "bg-neon text-accent-foreground hover:bg-neon/90 glow-cyan",
          )}
          title="A/B compare with the original (O)"
        >
          {isPlaying && isOriginal ? (
            <>
              <Square className="mr-2 h-4 w-4" /> Original
            </>
          ) : (
            <>
              <GitCompare className="mr-2 h-4 w-4" /> Original
            </>
          )}
        </Button>
        <Button
          variant={loop ? "default" : "secondary"}
          onClick={() => setLoop(!loop)}
          className={cn(
            "h-10 rounded-xl",
            loop && "bg-neon text-accent-foreground hover:bg-neon/90 glow-cyan",
          )}
        >
          <Repeat className="mr-2 h-4 w-4" /> Loop
        </Button>
      </div>
      <div className="flex items-center gap-4 font-mono text-sm">
        <span className="text-neon">{formatTime(playhead)}</span>
        <span className="text-muted-foreground">
          {formatTime(cropStart)} → {formatTime(cropEnd)}
        </span>
        <span className="text-muted-foreground/70">
          ({formatTime(cropEnd - cropStart)})
        </span>
      </div>
    </div>
  );
};
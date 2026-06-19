import { RotateCcw, Play, Square, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRebass } from "@/hooks/use-rebass";

export const ActionBar = () => {
  const { reset, preview, stop, download, isPlaying, isRendering } =
    useRebass();
  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card/90 p-3 backdrop-blur-md shadow-2xl">
      <Button
        variant="secondary"
        className="h-11 flex-1 rounded-xl"
        onClick={reset}
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
      <Button
        className="h-11 flex-1 rounded-xl bg-neon-violet text-primary-foreground hover:bg-neon-violet/90 glow"
        onClick={() => (isPlaying ? stop() : preview())}
      >
        {isPlaying ? (
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
        className="h-11 flex-1 rounded-xl bg-neon text-accent-foreground hover:bg-neon/90 glow-cyan"
        onClick={download}
        disabled={isRendering}
      >
        {isRendering ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" /> Download WAV
          </>
        )}
      </Button>
    </div>
  );
};
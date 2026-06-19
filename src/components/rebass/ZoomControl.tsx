import { ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useRebass } from "@/hooks/use-rebass";

export const ZoomControl = () => {
  const { zoom, setZoom, pan, setPan, buffer } = useRebass();
  const duration = buffer?.duration ?? 1;
  const visible = duration / zoom;
  const maxPan = Math.max(0, duration - visible);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg"
          onClick={() => setZoom(zoom - 2)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="flex w-40 items-center gap-2">
          <Slider
            value={[zoom]}
            min={1}
            max={40}
            step={1}
            onValueChange={(v) => setZoom(v[0])}
          />
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg"
          onClick={() => setZoom(zoom + 2)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="w-12 font-mono text-xs text-neon">
          {zoom.toFixed(0)}x
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <span className="text-xs text-muted-foreground">Pan</span>
        <Slider
          value={[pan]}
          min={0}
          max={maxPan || 0.0001}
          step={0.01}
          disabled={maxPan <= 0}
          onValueChange={(v) => setPan(v[0])}
        />
      </div>
    </div>
  );
};
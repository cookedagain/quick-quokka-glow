import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2, Music4 } from "lucide-react";
import { useRebass } from "@/hooks/use-rebass";
import { cn } from "@/lib/utils";

export const FileDropzone = () => {
  const { loadFile, isDecoding } = useRebass();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) loadFile(f);
    },
    [loadFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group cursor-pointer rounded-3xl border-2 border-dashed p-12 md:p-20 text-center transition-all",
        dragging
          ? "border-neon bg-neon/5 glow-cyan"
          : "border-border hover:border-neon-violet/60 hover:bg-card/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-neon-violet transition-transform group-hover:scale-110">
          {isDecoding ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : (
            <UploadCloud className="h-9 w-9" />
          )}
        </div>
        <div>
          <p className="text-lg font-semibold">
            {isDecoding ? "Decoding audio…" : "Drop an audio or video file"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse · MP3, WAV, M4A, MP4, WEBM…
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/70">
          <Music4 className="h-3.5 w-3.5" />
          Everything is processed locally in your browser
        </div>
      </div>
    </div>
  );
};
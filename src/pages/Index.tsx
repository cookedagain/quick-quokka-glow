import { Radio } from "lucide-react";
import { RebassProvider, useRebass } from "@/hooks/use-rebass";
import { FileDropzone } from "@/components/rebass/FileDropzone";
import { Editor } from "@/components/rebass/Editor";
import { MadeWithDyad } from "@/components/made-with-dyad";

const StudioBody = () => {
  const { buffer } = useRebass();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5 text-neon" />
          In-browser remix studio · 100% local
        </div>
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">
          Re<span className="text-neon-violet text-glow">Bass</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          Crop, slow, loop and bass-boost your tracks. Sculpt sound with a
          full-range EQ, reverb, echo and 8D — then export a WAV.
        </p>
        <div className="mx-auto mt-4 h-px w-40 bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {buffer ? <Editor /> : <FileDropzone />}
      </div>

      <MadeWithDyad />
    </div>
  );
};

const Index = () => {
  return (
    <RebassProvider>
      <StudioBody />
    </RebassProvider>
  );
};

export default Index;
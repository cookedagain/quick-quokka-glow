import { useState } from "react";
import { Sparkles, Save, Trash2, Share2 } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRebass } from "@/hooks/use-rebass";
import { BUILTIN_PRESETS } from "@/lib/audio/presets";

export const PresetPanel = () => {
  const {
    applyPreset,
    savePreset,
    userPresets,
    applyUserPreset,
    deletePreset,
    shareSettings,
  } = useRebass();
  const [name, setName] = useState("");

  const handleSave = () => {
    savePreset(name);
    setName("");
  };

  return (
    <PanelCard title="Presets" icon={Sparkles}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Tap a vibe, save your own, or share a link with your exact settings.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 rounded-xl"
          onClick={shareSettings}
        >
          <Share2 className="mr-1.5 h-4 w-4" /> Share
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUILTIN_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.settings)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-medium transition-all hover:border-neon-violet/60 hover:bg-neon-violet/10"
          >
            <span>{p.emoji}</span>
            {p.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your preset…"
          className="h-9 rounded-xl bg-secondary/40"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button
          onClick={handleSave}
          className="h-9 shrink-0 rounded-xl bg-neon-violet text-primary-foreground hover:bg-neon-violet/90"
        >
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>

      {userPresets.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {userPresets.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2"
            >
              <button
                onClick={() => applyUserPreset(p.id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium hover:text-neon"
              >
                {p.name}
              </button>
              <button
                onClick={() => deletePreset(p.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
};
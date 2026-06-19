import type { MutableRefObject } from "react";
import type { RebassSettings } from "@/lib/audio/types";

export interface CropRange {
  start: number;
  end: number;
}

export interface EngineRefs {
  settingsRef: MutableRefObject<RebassSettings>;
  cropRef: MutableRefObject<CropRange>;
  loopRef: MutableRefObject<boolean>;
}
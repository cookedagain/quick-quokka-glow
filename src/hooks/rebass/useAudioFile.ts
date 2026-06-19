import { useCallback, useState } from "react";
import { decodeFile } from "@/lib/audio/decode";
import { showError, showSuccess } from "@/utils/toast";

export function useAudioFile() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const decode = useCallback(async (f: File): Promise<AudioBuffer | null> => {
    setIsDecoding(true);
    try {
      const buf = await decodeFile(f);
      setFile(f);
      setBuffer(buf);
      showSuccess(`Loaded "${f.name}"`);
      return buf;
    } catch {
      showError(
        "Could not decode audio from this file. Try a different audio or video file.",
      );
      return null;
    } finally {
      setIsDecoding(false);
    }
  }, []);

  return { file, buffer, isDecoding, decode };
}
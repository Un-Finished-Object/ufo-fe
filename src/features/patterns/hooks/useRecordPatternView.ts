"use client";

import { useEffect, useRef, useState } from "react";
import { recordPatternView } from "@/features/patterns/services/recordPatternView";

export function useRecordPatternView({
  patternId,
  enabled,
}: {
  patternId: number;
  enabled: boolean;
}) {
  const [recordedView, setRecordedView] = useState<{
    patternId: number;
    viewCount: number;
  } | null>(null);
  const recordedPatternIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || recordedPatternIdRef.current === patternId) {
      return;
    }

    recordedPatternIdRef.current = patternId;

    void recordPatternView(patternId)
      .then((nextViewCount) => {
        setRecordedView({ patternId, viewCount: nextViewCount });
      })
      .catch(() => {
        // View recording must not block the pattern detail experience.
      });
  }, [enabled, patternId]);

  return recordedView?.patternId === patternId
    ? recordedView.viewCount
    : null;
}

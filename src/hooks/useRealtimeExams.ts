"use client";

import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type ExamChangeCallback = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

export function useRealtimeExams(onExamChange: ExamChangeCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleChange = useCallback(onExamChange, []);

  useEffect(() => {
    const channel = supabase
      .channel("exams-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Exam" },
        (payload) => {
          handleChange({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleChange]);
}

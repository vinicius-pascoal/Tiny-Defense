"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FeedbackTone = "info" | "warning";

export type FeedbackMessage = { id: number; text: string; tone: FeedbackTone };

/** Tempo de exibição de cada mensagem, em milissegundos de relógio real (não de simulação). */
const FEEDBACK_DURATION_MS = 2600;

/**
 * Mensagem curta e passageira (ex.: "Moedas insuficientes"). Uma nova mensagem
 * substitui a anterior e reinicia o tempo, para não empilhar avisos sobre o mapa.
 */
export function useFeedback() {
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const nextId = useRef(0);

  const notify = useCallback((text: string, tone: FeedbackTone = "info") => {
    nextId.current += 1;
    setMessage({ id: nextId.current, text, tone });
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return { message, notify };
}

"use client";

import { useSyncExternalStore } from "react";
import { getSaveSnapshot, getServerSaveSnapshot, subscribeSave } from "@/lib/storage";

/** Recordes e preferências salvos; no servidor (e na hidratação), os valores padrão. */
export function useSaveData() {
  return useSyncExternalStore(subscribeSave, getSaveSnapshot, getServerSaveSnapshot);
}

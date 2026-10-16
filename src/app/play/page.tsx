import type { Metadata } from "next";
import { GameShell } from "@/components/layout/GameShell";

export const metadata: Metadata = {
  title: "Partida — Tiny Defense",
};

export default function PlayPage() {
  return <GameShell />;
}

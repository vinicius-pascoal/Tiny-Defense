import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";

export const metadata: Metadata = {
  title: "Créditos — Tiny Defense",
};

const UI_PACK_URL = "https://crusenho.itch.io/complete-ui-book-styles-pack";
const UI_AUTHOR_URL = "https://crusenho.itch.io";
const FREDOKA_URL = "https://fonts.google.com/specimen/Fredoka";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-ink-900 underline decoration-2 underline-offset-2 hover:text-cover-500"
    >
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

function CreditSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-1 leading-snug text-ink-700">{children}</div>
    </section>
  );
}

export default function CreditsPage() {
  return (
    <ScreenShell>
      <h1 className="text-outline text-4xl font-bold text-gold-400 sm:text-5xl">Créditos</h1>

      <PixelPanel as="article" skin="paper" className="flex w-full max-w-xl flex-col gap-5 p-4 sm:p-5">
        <CreditSection title="Interface">
          <p>
            <ExternalLink href={UI_PACK_URL}>Complete UI Book Styles Pack</ExternalLink>, por{" "}
            <ExternalLink href={UI_AUTHOR_URL}>Crusenho Agus Hennihuno</ExternalLink>.
          </p>
          <p>
            Sprites usados sem modificações, apenas ampliados na tela. Licença completa em{" "}
            <code className="text-sm">docs/LICENSE_UI.txt</code>.
          </p>
        </CreditSection>

        <CreditSection title="Personagens, torres e cenário">
          <p>Pacote de sprites “Simple Tower Defense”.</p>
          <p
            role="note"
            className="rounded-sm border-l-4 border-danger-500 bg-parchment-100 px-3 py-2 text-ink-900"
          >
            <strong>Licença pendente:</strong> o pacote veio sem arquivo de licença. A origem e a
            permissão de distribuição precisam ser verificadas antes de qualquer publicação.
          </p>
        </CreditSection>

        <CreditSection title="Tipografia">
          <p>
            <ExternalLink href={FREDOKA_URL}>Fredoka</ExternalLink>, via Google Fonts (SIL Open Font
            License).
          </p>
        </CreditSection>

        <CreditSection title="Tecnologia">
          <p>Feito com Next.js, React, TypeScript e Tailwind CSS.</p>
        </CreditSection>
      </PixelPanel>

      <PixelButton href="/" icon="home">
        Voltar ao menu
      </PixelButton>
    </ScreenShell>
  );
}

import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import type { UiIconName } from "@/lib/assets";
import type { FeedbackMessage, FeedbackTone } from "@/hooks/useFeedback";

const TONE_ICON: Record<FeedbackTone, UiIconName> = { info: "tick", warning: "cross", reward: "coin" };

type FeedbackToastProps = {
  message: FeedbackMessage | null;
};

/**
 * Aviso curto sobre o rodapé do mapa. Não recebe ponteiro (o toque passa para o mapa)
 * e a região viva fica sempre montada para leitores de tela anunciarem cada mensagem.
 */
export function FeedbackToast({ message }: FeedbackToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center"
    >
      {message && (
        <PixelPanel
          key={message.id}
          skin="paper"
          className="feedback-toast flex max-w-full items-center gap-2 px-2 py-1 text-sm font-medium leading-snug sm:text-base"
        >
          <PixelIcon name={TONE_ICON[message.tone]} />
          {message.text}
        </PixelPanel>
      )}
    </div>
  );
}

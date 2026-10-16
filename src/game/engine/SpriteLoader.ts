/**
 * Carregador de imagens com cache: cada URL é baixada e decodificada uma única vez
 * por sessão. Falhas são devolvidas como dados, nunca lançadas para o loop do jogo,
 * e saem do cache para permitir uma nova tentativa.
 */

export type SpriteLoadProgress = { loaded: number; total: number };

export type SpriteLoadResult = {
  images: ReadonlyMap<string, HTMLImageElement>;
  failed: readonly string[];
};

export class SpriteLoader {
  private readonly cache = new Map<string, Promise<HTMLImageElement>>();

  load(src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(src);
    if (cached) return cached;

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Falha ao carregar sprite: ${src}`));
      image.src = src;
    });
    promise.catch(() => this.cache.delete(src));

    this.cache.set(src, promise);
    return promise;
  }

  async loadAll(
    sources: readonly string[],
    onProgress?: (progress: SpriteLoadProgress) => void,
  ): Promise<SpriteLoadResult> {
    const images = new Map<string, HTMLImageElement>();
    const failed: string[] = [];
    let loaded = 0;

    await Promise.all(
      sources.map(async (src) => {
        try {
          images.set(src, await this.load(src));
        } catch (error) {
          console.error(error);
          failed.push(src);
        } finally {
          loaded += 1;
          onProgress?.({ loaded, total: sources.length });
        }
      }),
    );

    return { images, failed };
  }
}

/** Instância compartilhada: navegar entre telas reaproveita as imagens já carregadas. */
export const spriteLoader = new SpriteLoader();

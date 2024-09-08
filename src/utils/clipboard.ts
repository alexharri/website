export async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export class ClipboardUtils {
  public static async readTypesFromClipboard(): Promise<Set<string>> {
    const items: ClipboardItem[] = await navigator.clipboard.read();
    const types = new Set<string>();
    for (const item of items) {
      console.log(item.types);
      for (const type of item.types) {
        types.add(type);
      }
    }
    return types;
  }

  public static async writeTextToClipboard(text: string, type = "text/plain") {
    await this.writeBlobsToClipboard(this.toBlob(text, type));
  }

  public static async writeJsonToClipboard(text: unknown, type = "application/json") {
    await this.writeTextToClipboard(JSON.stringify(text), type);
  }

  public static async writeImageToClipboard(href: string) {
    const res = await fetch(href);
    const blob = await res.blob();
    await this.writeBlobsToClipboard(blob);
  }

  public static async writeBlobsToClipboard(blobs: Blob | Blob[]) {
    if (!Array.isArray(blobs)) blobs = [blobs];
    const blobMap = blobs.reduce<Record<string, Blob>>((acc, blob) => {
      acc[blob.type] = blob;
      return acc;
    }, {});
    await navigator.clipboard.write([new ClipboardItem(blobMap)]);
  }

  private static toBlob(text: string, type: string): Blob {
    const bytes = new TextEncoder().encode(text);
    return new Blob([bytes], { type });
  }
}

/**
 * What a file request will accept.
 *
 * Deliberately a short list of things a person would say out loud —
 * "images", "a PDF" — rather than a MIME picker. An agency asking for
 * a logo wants to say "images", not to reason about `image/svg+xml`
 * versus `image/vnd.adobe.photoshop`.
 *
 * Matching is by EXTENSION, not MIME type. Browsers disagree about
 * MIME constantly: .svg arrives as `text/xml` or empty, .heic from an
 * iPhone often arrives as `application/octet-stream`, and .docx is a
 * zip as far as most systems are concerned. Extension is what the
 * person actually chose and what they see in their own file browser,
 * so rejecting on it is both more accurate and easier to explain.
 *
 * No server imports, because both the client's uploader and the
 * server that guards it have to agree on the same answer.
 */

export type FileKind = "any" | "image" | "pdf" | "doc" | "sheet" | "video" | "zip";

interface KindSpec {
  label: string;
  /** Shown to the client under the request. */
  short: string;
  /** null means anything goes. */
  exts: string[] | null;
  /** For the file picker's own filter. Not trusted; drag-and-drop ignores it. */
  accept: string;
}

export const FILE_KINDS: Record<FileKind, KindSpec> = {
  any: {
    label: "Any file",
    short: "Any file type",
    exts: null,
    accept: "",
  },
  image: {
    label: "Images",
    short: "PNG, JPG, SVG, WebP or HEIC",
    exts: ["png", "jpg", "jpeg", "webp", "gif", "svg", "heic", "heif", "avif", "tif", "tiff", "bmp"],
    accept: "image/*,.svg,.heic,.heif",
  },
  pdf: {
    label: "PDF only",
    short: "PDF",
    exts: ["pdf"],
    accept: ".pdf,application/pdf",
  },
  doc: {
    label: "Documents",
    short: "PDF, Word, Pages or plain text",
    exts: ["pdf", "doc", "docx", "odt", "rtf", "txt", "md", "pages"],
    accept: ".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.pages",
  },
  sheet: {
    label: "Spreadsheets",
    short: "Excel, Numbers or CSV",
    exts: ["xls", "xlsx", "csv", "tsv", "ods", "numbers"],
    accept: ".xls,.xlsx,.csv,.tsv,.ods,.numbers",
  },
  video: {
    label: "Video",
    short: "MP4, MOV or WebM",
    exts: ["mp4", "mov", "webm", "m4v", "avi", "mkv"],
    accept: "video/*",
  },
  zip: {
    label: "Archives",
    short: "ZIP, RAR or 7z",
    exts: ["zip", "rar", "7z", "tar", "gz"],
    accept: ".zip,.rar,.7z,.tar,.gz",
  },
};

/** Anything unrecognised — including nothing at all — means "any". */
export function fileKind(value: unknown): FileKind {
  return typeof value === "string" && value in FILE_KINDS
    ? (value as FileKind)
    : "any";
}

/** Lowercase extension without the dot, or "" when there isn't one. */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 1 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export function isAllowedFile(kindValue: unknown, filename: string): boolean {
  const spec = FILE_KINDS[fileKind(kindValue)];
  if (!spec.exts) return true;
  return spec.exts.includes(extensionOf(filename));
}

/** The `accept` attribute for the picker. Convenience only. */
export function acceptAttribute(kindValue: unknown): string | undefined {
  return FILE_KINDS[fileKind(kindValue)].accept || undefined;
}

/** "PDF, Word, Pages or plain text" — for the client-facing hint. */
export function kindDescription(kindValue: unknown): string {
  return FILE_KINDS[fileKind(kindValue)].short;
}

/** The message a client sees when they pick the wrong thing. */
export function rejectionMessage(kindValue: unknown, filename: string): string {
  const ext = extensionOf(filename);
  const spec = FILE_KINDS[fileKind(kindValue)];
  return `${ext ? `.${ext} files aren't` : "That file isn't"} accepted here — send ${spec.short.toLowerCase()}.`;
}

/** The options offered in the step editor, in the order they read best. */
export const FILE_KIND_OPTIONS = (Object.keys(FILE_KINDS) as FileKind[]).map(
  (value) => ({ value, label: FILE_KINDS[value].label }),
);

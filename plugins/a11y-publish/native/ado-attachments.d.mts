export interface AttachmentInput {
  prId: number;
  attachments: Array<{ name: string; localPath: string; sha256?: string }>;
  commentMarkdown?: string;
  appendToDescription?: string;
  expectedHead?: string;
}
export interface AttachmentResult {
  prId: number;
  uploaded: Array<{ name: string; url: string }>;
  commentPosted: boolean;
  descriptionUpdated: boolean;
  descriptionPruned: boolean;
  prunedDescriptionSections: string[];
}
export function attachPrEvidence(
  configuration: { organization: string; project: string; repositoryId: string; authorization: string },
  input: AttachmentInput,
  options?: {
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
    readFetch?: (input: string, init?: RequestInit) => Promise<Response>;
    log?: (message: string) => void;
  },
): Promise<AttachmentResult>;

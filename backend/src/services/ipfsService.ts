import { config } from "../config";
import { HttpError } from "../utils/HttpError";

interface PinataPinResponse {
  IpfsHash: string;
}

function assertConfigured() {
  if (!config.ipfs.pinataJwt) {
    throw HttpError.badRequest(
      "IPFS upload is not configured (missing PINATA_JWT env var)"
    );
  }
}

function authHeader(): string {
  return "Bearer " + config.ipfs.pinataJwt;
}

/** Uploads a raw file buffer (e.g. NFT image) to IPFS via Pinata, returns an ipfs:// URI. */
export async function uploadFileToIpfs(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  assertConfigured();

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  const res = await fetch(`${config.ipfs.pinataApiUrl}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: authHeader() },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Pinata file upload failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as PinataPinResponse;
  return `ipfs://${data.IpfsHash}`;
}

/** Uploads an ERC-1155/721-style metadata JSON object to IPFS via Pinata, returns an ipfs:// URI. */
export async function uploadJsonToIpfs(metadata: Record<string, unknown>): Promise<string> {
  assertConfigured();

  const res = await fetch(`${config.ipfs.pinataApiUrl}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinataContent: metadata }),
  });

  if (!res.ok) {
    throw new Error(`Pinata JSON upload failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as PinataPinResponse;
  return `ipfs://${data.IpfsHash}`;
}

/** Converts an ipfs:// URI into an HTTP gateway URL for display purposes. */
export function toGatewayUrl(ipfsUri: string): string {
  if (!ipfsUri.startsWith("ipfs://")) return ipfsUri;
  return `${config.ipfs.pinataGatewayUrl}/${ipfsUri.slice("ipfs://".length)}`;
}

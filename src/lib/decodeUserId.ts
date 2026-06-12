/**
 * Extract the user id (JWT `sub` claim) from an access token without
 * verifying the signature. Safe only on the server for routing decisions —
 * the backend re-validates the token on every proxied request.
 */
export function decodeUserId(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf-8"),
    );
    return Number(payload.sub) || null;
  } catch {
    return null;
  }
}

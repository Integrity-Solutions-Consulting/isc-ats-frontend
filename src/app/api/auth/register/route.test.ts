import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register — forwards consent fields unchanged", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 201 }),
    ) as unknown as typeof fetch;
  });

  it("forwards accepts_terms and accepts_marketing to the backend as sent", async () => {
    await POST(
      makeRequest({
        email: "candidato@test.example.com",
        password: "StrongPass123!",
        turnstile_token: null,
        accepts_terms: true,
        accepts_marketing: true,
      }),
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const forwarded = JSON.parse(options.body as string);
    expect(forwarded.accepts_terms).toBe(true);
    expect(forwarded.accepts_marketing).toBe(true);
  });

  it("forwards accepts_marketing=false unchanged (does not default it to true)", async () => {
    await POST(
      makeRequest({
        email: "candidato2@test.example.com",
        password: "StrongPass123!",
        turnstile_token: null,
        accepts_terms: true,
        accepts_marketing: false,
      }),
    );

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const forwarded = JSON.parse(options.body as string);
    expect(forwarded.accepts_terms).toBe(true);
    expect(forwarded.accepts_marketing).toBe(false);
  });
});

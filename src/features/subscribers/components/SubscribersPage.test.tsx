import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SubscribersPage } from "./SubscribersPage";

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SubscribersPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });
  // jsdom attempts a real navigation when a real <a href> is clicked; the
  // component only needs the click to fire, not an actual page navigation.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

describe("SubscribersPage", () => {
  it("renders the subscriber count fetched from the backend", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 42 }),
    }) as unknown as typeof fetch;

    renderPage();

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith("/api/auth/subscribers", { cache: "no-store" });
  });

  it("has a working download button pointing at the export proxy route", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/subscribers/export") {
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(["xlsx-bytes"]),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ count: 0 }) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = userEvent.setup();
    renderPage();

    const button = await screen.findByRole("button", { name: /descargar excel/i });
    await user.click(button);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/subscribers/export"),
    );
  });
});

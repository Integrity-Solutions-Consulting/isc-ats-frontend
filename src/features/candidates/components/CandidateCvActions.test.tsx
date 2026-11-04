import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CandidateCvActions } from "./CandidateCvActions";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CandidateCvActions — view and download", () => {
  it("opens the CV preview in a new tab", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<CandidateCvActions fileId={42} />);

    await userEvent.click(screen.getByRole("button", { name: /ver/i }));

    expect(open).toHaveBeenCalledWith(
      "/api/candidate/cv/42?view=1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("renders a download button instead of an unvalidated download link", () => {
    render(<CandidateCvActions fileId={42} />);

    expect(
      screen.getByRole("button", { name: /descargar/i }),
    ).toBeInTheDocument();
  });
});

describe("CandidateCvActions — table variant", () => {
  it("renders two icon-only buttons labelled for the candidate", () => {
    render(<CandidateCvActions fileId={42} compact subject="Jane Doe" />);

    expect(
      screen.getByRole("button", { name: "Ver hoja de vida de Jane Doe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Descargar hoja de vida de Jane Doe",
      }),
    ).toBeInTheDocument();
  });

  it("does not bubble the view click to a clickable row", async () => {
    const onRowClick = vi.fn();
    vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <div onClick={onRowClick}>
        <CandidateCvActions fileId={42} compact />
      </div>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /ver hoja de vida/i }),
    );

    expect(onRowClick).not.toHaveBeenCalled();
  });
});

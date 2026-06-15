import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { Combobox, type ComboboxOption } from "@/design-system/molecules/Combobox";

const OPTIONS: ComboboxOption[] = [
  { id: "1", label: "React" },
  { id: "2", label: "Vue" },
  { id: "3", label: "Angular" },
];

describe("Combobox", () => {
  it("renders the input element", () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} placeholder="Search..." />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows all options when input is focused", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} />
    );
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("filters options by typed input", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} />
    );
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "vue");
    const visibleOptions = screen.getAllByRole("option");
    expect(visibleOptions).toHaveLength(1);
    expect(visibleOptions[0]).toHaveTextContent("Vue");
  });

  it("calls onChange with the option label on selection", async () => {
    const onChange = vi.fn();
    render(
      <Combobox options={OPTIONS} value="" onChange={onChange} />
    );
    await userEvent.click(screen.getByRole("combobox"));
    const optionEl = screen.getByRole("option", { name: "React" });
    await userEvent.pointer({ target: optionEl, keys: "[MouseLeft>]" });
    expect(onChange).toHaveBeenCalledWith("React");
  });

  it("applies danger border class when aria-invalid is true", () => {
    render(
      <Combobox
        options={OPTIONS}
        value=""
        onChange={vi.fn()}
        aria-invalid={true}
      />
    );
    const input = screen.getByRole("combobox");
    expect(input.className).toMatch(/border-danger/);
  });

  it("renders listbox role when open", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} />
    );
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  // WAI-ARIA 1.2: role="combobox" must be on the <input>, not a wrapper div.
  it("has role=combobox, aria-expanded and aria-controls on the input element", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} id="test-cb" />
    );
    const input = screen.getByRole("combobox");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-controls", "test-cb-listbox");

    await userEvent.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("aria-controls on input matches the listbox id", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} id="my-cb" />
    );
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    const listbox = screen.getByRole("listbox");
    expect(listbox.id).toBe(input.getAttribute("aria-controls"));
  });

  it("listbox id is always defined even without an id prop", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} />
    );
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    const listbox = screen.getByRole("listbox");
    const ariaControls = input.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();
    expect(listbox.id).toBe(ariaControls);
  });

  it("shows 'Sin resultados' when no options match the query", async () => {
    render(
      <Combobox options={OPTIONS} value="" onChange={vi.fn()} />
    );
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "zzznomatch");
    // Listbox still rendered with a single disabled option
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const emptyOption = screen.getByRole("option", { name: "Sin resultados" });
    expect(emptyOption).toBeInTheDocument();
    expect(emptyOption).toHaveAttribute("aria-disabled", "true");
  });

  describe("id mode (valueKey='id')", () => {
    it("displays the label of the selected id, not the id itself", () => {
      render(
        <Combobox options={OPTIONS} value="2" onChange={vi.fn()} valueKey="id" />
      );
      // value is the id "2" but the input shows the matching label "Vue".
      expect(screen.getByRole("combobox")).toHaveValue("Vue");
    });

    it("emits the option id on selection (not the label)", async () => {
      const onChange = vi.fn();
      render(
        <Combobox options={OPTIONS} value="" onChange={onChange} valueKey="id" />
      );
      await userEvent.click(screen.getByRole("combobox"));
      const optionEl = screen.getByRole("option", { name: "Angular" });
      await userEvent.pointer({ target: optionEl, keys: "[MouseLeft>]" });
      expect(onChange).toHaveBeenCalledWith("3");
    });

    it("typing filters but never calls onChange (free text is not a valid value)", async () => {
      const onChange = vi.fn();
      render(
        <Combobox options={OPTIONS} value="" onChange={onChange} valueKey="id" />
      );
      const input = screen.getByRole("combobox");
      await userEvent.click(input);
      await userEvent.type(input, "ang");
      const visibleOptions = screen.getAllByRole("option");
      expect(visibleOptions).toHaveLength(1);
      expect(visibleOptions[0]).toHaveTextContent("Angular");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("resolves the label when options arrive after the value (async edit mode)", () => {
      const { rerender } = render(
        <Combobox options={[]} value="2" onChange={vi.fn()} valueKey="id" />
      );
      // No options yet → the label for id "2" can't be resolved.
      expect(screen.getByRole("combobox")).toHaveValue("");
      rerender(
        <Combobox options={OPTIONS} value="2" onChange={vi.fn()} valueKey="id" />
      );
      // Options arrived → the input now shows "Vue".
      expect(screen.getByRole("combobox")).toHaveValue("Vue");
    });
  });
});

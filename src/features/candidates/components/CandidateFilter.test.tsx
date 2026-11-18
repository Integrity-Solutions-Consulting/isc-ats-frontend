import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CandidateFilter } from "./CandidateFilter";

afterEach(cleanup);

it.each(["Ciudad", "Tecnología", "Carrera"])("permits searching and selecting %s options", async (title) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<CandidateFilter title={title} ariaLabel={title} className="w-48" value="" onChange={onChange}
    options={[{ id: "cpp", label: "C++" }, { id: "java", label: "Java" }]} />);
  const input = screen.getByRole("combobox", { name: title });
  expect(input).not.toHaveAttribute("readonly");
  await user.click(input);
  await user.type(input, "C++");
  expect(screen.queryByRole("option", { name: "Java" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("option", { name: "C++" }));
  expect(onChange).toHaveBeenCalledWith("cpp");
});

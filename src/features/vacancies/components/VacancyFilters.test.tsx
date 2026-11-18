import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { VacancyFilters } from "./VacancyFilters";

it("allows selecting the four filters without editable text and keeps client search editable", async () => {
  const onChange = vi.fn();
  render(<VacancyFilters filters={{ search: "", clientCompany: null, department: null, status: null, level: null, isActiveFilter: "active" }} onChange={onChange} clients={[]} departments={[{ id: "it", label: "Tecnología" }]} levels={[{ id: "senior", label: "Senior" }]} />);
  const user = userEvent.setup();
  const department = screen.getByRole("combobox", { name: "Filtrar por departamento" });
  const situation = screen.getByRole("combobox", { name: "Filtrar por situación" });
  const level = screen.getByRole("combobox", { name: "Filtrar por nivel" });
  const state = screen.getByRole("combobox", { name: "Filtrar por estado de auditoría" });
  for (const control of [department, situation, level, state]) expect(control).toHaveAttribute("readonly");
  expect(screen.getByRole("combobox", { name: "Filtrar por cliente" })).not.toHaveAttribute("readonly");

  await user.click(department);
  await user.keyboard("{ArrowDown}{Enter}");
  await user.click(situation);
  await user.click(screen.getByRole("option", { name: "Publicada" }));
  await user.click(level);
  await user.click(screen.getByRole("option", { name: "Senior" }));
  await user.click(state);
  await user.click(screen.getByRole("option", { name: "Todos" }));
  expect(onChange.mock.calls.map(([patch]) => patch)).toEqual([
    { department: "it" }, { status: "active" }, { level: "senior" }, { isActiveFilter: "all" },
  ]);
});

it("shows placeholders when no filters are applied", () => {
  render(<VacancyFilters filters={{ search: "", clientCompany: null, department: null, status: null, level: null, isActiveFilter: "all" }} onChange={vi.fn()} clients={[]} departments={[]} levels={[]} />);
  for (const placeholder of ["Cliente", "Departamento", "Situación", "Nivel", "Estado"]) {
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue("");
  }
});

it("accepts letters and spaces but removes digits and special characters from vacancy search", () => {
  const onChange = vi.fn();
  render(<VacancyFilters filters={{ search: "", clientCompany: null, department: null, status: null, level: null, isActiveFilter: "all" }} onChange={onChange} clients={[]} departments={[]} levels={[]} />);
  fireEvent.change(screen.getByPlaceholderText("Buscar por nombre de vacante…"), {
    target: { value: "Ingeniería 123 ñandú @#$" },
  });
  expect(onChange).toHaveBeenCalledWith({ search: "Ingeniería  ñandú " });
});

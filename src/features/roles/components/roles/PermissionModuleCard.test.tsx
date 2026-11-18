import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { PermissionModuleCard } from './PermissionModuleCard';

it('explains the module without changing its permissions', async () => {
  const onToggleModule = vi.fn();
  render(<PermissionModuleCard mod={{ key: 'recruitment', label: 'Reclutamiento', accent: '', resources: [] }} granted={new Set()} onTogglePerm={vi.fn()} onToggleModule={onToggleModule} />);
  await userEvent.click(screen.getByRole('button', { name: 'Información sobre Reclutamiento' }));
  expect(screen.getByText(/vacantes, candidatos, postulaciones y entrevistas/)).toBeInTheDocument();
  expect(onToggleModule).not.toHaveBeenCalled();
});

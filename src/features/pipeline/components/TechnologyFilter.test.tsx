import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import { TechnologyFilter } from './TechnologyFilter';

afterEach(cleanup);

function Harness() {
  const [selected, setSelected] = useState<string[]>([]);
  return <TechnologyFilter options={['Gestión', 'SQL']} selected={selected} onChange={setSelected} />;
}

it('searches without accents, keeps selections between searches and restores trigger focus on Escape', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: /Tecnologías y conocimientos/ });
  trigger.focus();
  await user.keyboard('{Enter}');
  const search = screen.getByRole('searchbox');
  expect(search).toHaveFocus();
  await user.type(search, 'gestion');
  expect(screen.queryByRole('checkbox', { name: 'SQL' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Gestión' }));
  await user.clear(search);
  await user.type(search, 'sql');
  await user.click(screen.getByRole('checkbox', { name: 'SQL' }));
  await user.clear(search);
  expect(screen.getByRole('checkbox', { name: 'Gestión' })).toBeChecked();
  expect(trigger).toHaveTextContent('2 seleccionados');
  await user.click(screen.getByRole('button', { name: 'Limpiar selección' }));
  expect(screen.getByRole('checkbox', { name: 'SQL' })).not.toBeChecked();
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
});

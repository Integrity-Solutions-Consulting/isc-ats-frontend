import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { EMPTY_FILTERS } from '../filters';
import { PipelineFilterBar } from './PipelineFilterBar';

it('keeps only digits in numeric filters and shows unselected filter placeholders', () => {
  function Fixture() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    return <PipelineFilterBar filters={filters} onChange={setFilters} stages={[]} cityOptions={[]} universityOptions={[]} technologyOptions={[]} shownCount={0} totalCount={0} />;
  }
  render(<Fixture />);
  for (const name of ['Cumplimiento mínimo', 'Aspiración salarial desde', 'Aspiración salarial hasta', 'Experiencia mínima']) {
    const field = screen.getByRole('textbox', { name });
    fireEvent.change(field, { target: { value: '+12-3;abc' } });
    expect(field).toHaveValue('123');
    fireEvent.change(field, { target: { value: '' } });
    expect(field).toHaveValue('');
  }
  for (const name of ['Ciudad', 'Universidad', 'Estudia actualmente', 'Estado']) {
    expect(screen.getByLabelText(name)).toHaveAttribute('placeholder', name);
  }
  for (const name of ['Ciudad', 'Universidad']) {
    const field = screen.getByLabelText(name);
    expect(field).not.toHaveAttribute('readonly');
    fireEvent.change(field, { target: { value: 'Quito 123 @"áñ' } });
    expect(field).toHaveValue('Quito  áñ');
  }
  for (const name of ['Estudia actualmente', 'Estado']) expect(screen.getByLabelText(name)).toHaveAttribute('readonly');
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { LegalModal } from './LegalModal';

describe('LegalModal', () => {
  it('does not render the "Última actualización" line (cosmetic removal)', () => {
    render(<LegalModal doc="terms" onClose={() => {}} />);
    expect(screen.queryByText(/Última actualización/i)).not.toBeInTheDocument();
  });

  it('still renders the document title and content', () => {
    render(<LegalModal doc="terms" onClose={() => {}} />);
    expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
  });
});

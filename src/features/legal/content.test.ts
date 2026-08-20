import { describe, it, expect } from 'vitest';

import { LEGAL_DOCS } from './content';

// D4 (design): the frontend's LegalDocument.version and the backend's
// ConsentsService.CURRENT_POLICY_VERSION (app/modules/auth/application/
// consents_service.py) must always agree. If either side bumps its policy
// version, the other MUST be bumped in the same change — these two tests are
// the tripwire.
describe('LEGAL_DOCS version (backend policy version coupling — D4)', () => {
  it('terms.version matches the backend CURRENT_POLICY_VERSION', () => {
    expect(LEGAL_DOCS.terms.version).toBe('1.0');
  });

  it('privacy.version matches the backend CURRENT_POLICY_VERSION', () => {
    expect(LEGAL_DOCS.privacy.version).toBe('1.0');
  });
});

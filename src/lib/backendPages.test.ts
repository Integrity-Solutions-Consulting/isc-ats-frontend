import { describe, it, expect, vi, beforeEach } from 'vitest';

const backendGet = vi.fn();
vi.mock('@/lib/backendFetch', () => ({ backendGet: (p: string) => backendGet(p) }));

const { backendGetAllPages } = await import('./backendPages');

interface Row { id: number }

/** Serves `total` rows split into 100-row pages, recording every requested URL. */
function servePages(total: number) {
  backendGet.mockImplementation((url: string) => {
    const page = Number(new URL(url, 'http://x').searchParams.get('page'));
    const start = (page - 1) * 100;
    const items: Row[] = [];
    for (let i = start; i < Math.min(start + 100, total); i += 1) items.push({ id: i + 1 });
    return Promise.resolve({ items, total });
  });
}

describe('backendGetAllPages', () => {
  beforeEach(() => backendGet.mockReset());

  it('returns every row when the collection spans several pages', async () => {
    servePages(250);

    const rows = await backendGetAllPages<Row>('/auth/users');

    expect(rows).toHaveLength(250);
    // The regression this exists for: the newest rows sit last under the
    // backend's ascending-id ordering, so they are what a single-page fetch drops.
    expect(rows.at(-1)).toEqual({ id: 250 });
    expect(backendGet).toHaveBeenCalledTimes(3);
  });

  it('stops after one request when everything fits in a single page', async () => {
    servePages(40);

    const rows = await backendGetAllPages<Row>('/auth/users');

    expect(rows).toHaveLength(40);
    expect(backendGet).toHaveBeenCalledTimes(1);
  });

  it('requests the backend maximum page size', async () => {
    servePages(10);

    await backendGetAllPages<Row>('/auth/users');

    expect(backendGet).toHaveBeenCalledWith('/auth/users?page=1&size=100');
  });

  it('appends its pagination with & when the path already has a query string', async () => {
    servePages(10);

    await backendGetAllPages<Row>('/auth/users?is_active=true');

    expect(backendGet).toHaveBeenCalledWith('/auth/users?is_active=true&page=1&size=100');
  });

  it('handles an empty collection without extra requests', async () => {
    servePages(0);

    const rows = await backendGetAllPages<Row>('/auth/users');

    expect(rows).toEqual([]);
    expect(backendGet).toHaveBeenCalledTimes(1);
  });
});

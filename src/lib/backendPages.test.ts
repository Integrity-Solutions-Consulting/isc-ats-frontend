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

  it('overlaps at most four remaining pages and preserves their original order', async () => {
    let active = 0;
    let peak = 0;
    backendGet.mockImplementation(async (url: string) => {
      const page = Number(new URL(url, 'http://x').searchParams.get('page'));
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, page % 2 ? 8 : 1));
      active -= 1;
      return { total: 650, items: Array.from({ length: page === 7 ? 50 : 100 }, (_, i) => ({ id: (page - 1) * 100 + i + 1 })) };
    });
    const rows = await backendGetAllPages<Row>('/auth/users');
    expect(peak).toBe(4);
    expect(rows.map((row) => row.id)).toEqual(Array.from({ length: 650 }, (_, i) => i + 1));
  });

  it('rejects incomplete lists rather than hiding missing records', async () => {
    backendGet.mockResolvedValueOnce({ items: Array.from({ length: 100 }, (_, id) => ({ id })), total: 200 });
    backendGet.mockResolvedValueOnce({ items: [], total: 200 });
    await expect(backendGetAllPages('/auth/users')).rejects.toThrow();
  });

  it('propagates failures from later pages', async () => {
    backendGet.mockResolvedValueOnce({ items: Array.from({ length: 100 }, (_, id) => ({ id })), total: 200 });
    backendGet.mockRejectedValueOnce(new Error('Backend unavailable'));
    await expect(backendGetAllPages('/auth/users')).rejects.toThrow('Backend unavailable');
  });

  it('loads a supported large batch once without truncating records', async () => {
    backendGet.mockResolvedValue({ items: Array.from({ length: 810 }, (_, id) => ({ id })), total: 810 });
    const rows = await backendGetAllPages<Row>('/auth/users', { pageSize: 1000 });
    expect(rows).toHaveLength(810);
    expect(backendGet).toHaveBeenCalledExactlyOnceWith('/auth/users?page=1&size=1000');
  });

  it('uses the requested batch size for later pages', async () => {
    backendGet.mockResolvedValueOnce({ items: Array.from({ length: 1000 }, (_, id) => ({ id })), total: 1050 });
    backendGet.mockResolvedValueOnce({ items: Array.from({ length: 50 }, (_, id) => ({ id: 1000 + id })), total: 1050 });
    expect(await backendGetAllPages<Row>('/auth/users', { pageSize: 1000 })).toHaveLength(1050);
    expect(backendGet).toHaveBeenLastCalledWith('/auth/users?page=2&size=1000');
  });

  it('falls back only when an older backend rejects the larger size', async () => {
    backendGet.mockRejectedValueOnce({ status: 422 });
    backendGet.mockResolvedValueOnce({ items: [{ id: 1 }], total: 1 });
    expect(await backendGetAllPages<Row>('/auth/users', { pageSize: 1000 })).toEqual([{ id: 1 }]);
    expect(backendGet).toHaveBeenLastCalledWith('/auth/users?page=1&size=100');
  });

  it('does not retry permission failures with another batch size', async () => {
    backendGet.mockRejectedValueOnce({ status: 403 });
    await expect(backendGetAllPages('/auth/users', { pageSize: 1000 })).rejects.toMatchObject({ status: 403 });
    expect(backendGet).toHaveBeenCalledTimes(1);
  });
});

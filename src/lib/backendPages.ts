import { backendGet } from "@/lib/backendFetch";

/** Shape every paginated backend list endpoint returns. */
interface BackendPage<T> {
  items: T[];
  total: number;
}

/**
 * Default size for endpoints whose public limit is 100. The directory and user
 * endpoints additionally support bounded 1000-row batches for local filtering.
 */
const MAX_BACKEND_PAGE_SIZE = 100;

/**
 * Fetches every page of a paginated backend list and returns the flattened items.
 *
 * Callers used to request a single `?size=100` page and treat it as the whole
 * collection. That silently truncated at 100 rows: the backend orders by ascending
 * id, so the NEWEST records fell off the end — a freshly created user was invisible
 * on the Usuarios screen while a hundred older accounts showed fine.
 *
 * Fetch at most four pages at a time, preserving the backend order. This avoids
 * one network round trip per page without flooding the backend with requests.
 * No data is cached here: authorization remains attached to every caller.
 */
export async function backendGetAllPages<T>(path: string, options: { pageSize?: 100 | 1000 } = {}): Promise<T[]> {
  let pageSize = options.pageSize ?? MAX_BACKEND_PAGE_SIZE;
  const separator = path.includes("?") ? "&" : "?";
  const pageUrl = (page: number) =>
    `${path}${separator}page=${page}&size=${pageSize}`;

  let first: BackendPage<T>;
  try {
    first = await backendGet<BackendPage<T>>(pageUrl(1));
  } catch (error) {
    // Older deployments accept only 100; do not hide authentication or network errors.
    if (pageSize === 1000 && typeof error === "object" && error !== null && "status" in error && error.status === 422) {
      pageSize = MAX_BACKEND_PAGE_SIZE;
      first = await backendGet<BackendPage<T>>(pageUrl(1));
    } else {
      throw error;
    }
  }
  const items = [...first.items];

  if (items.length >= first.total) return items;
  if (!items.length) throw new Error("El listado devolvió una página vacía antes de completarse.");

  // A short non-final page may mean the endpoint imposes a smaller limit.
  // Follow those pages until complete rather than guessing their count.
  if (first.items.length < pageSize) {
    for (let page = 2; items.length < first.total; page += 1) {
      const next = await backendGet<BackendPage<T>>(pageUrl(page));
      if (!next.items.length) throw new Error("No se pudo cargar el listado completo.");
      items.push(...next.items);
    }
    return items;
  }
  const pageCount = Math.ceil(first.total / pageSize);
  for (let page = 2; page <= pageCount; page += 4) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, pageCount - page + 1) }, (_, index) =>
        backendGet<BackendPage<T>>(pageUrl(page + index)),
      ),
    );
    for (const next of pages) {
      if (!next.items.length && items.length < first.total) {
        throw new Error("El listado devolvió una página vacía antes de completarse.");
      }
      items.push(...next.items);
    }
  }

  if (items.length < first.total) throw new Error("No se pudo cargar el listado completo.");

  return items;
}

import { backendGet } from "@/lib/backendFetch";

/** Shape every paginated backend list endpoint returns. */
interface BackendPage<T> {
  items: T[];
  total: number;
}

/**
 * Largest page the backend accepts: its list endpoints declare
 * `size: Query(ge=1, le=100)`, so asking for more is rejected outright.
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
 * Pages are fetched sequentially rather than in parallel so a large collection
 * cannot fan out into dozens of simultaneous backend requests. The cost is one
 * round trip per 100 records, which is why this belongs only on screens that
 * genuinely need the full set in memory to filter and paginate client-side.
 */
export async function backendGetAllPages<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const pageUrl = (page: number) =>
    `${path}${separator}page=${page}&size=${MAX_BACKEND_PAGE_SIZE}`;

  const first = await backendGet<BackendPage<T>>(pageUrl(1));
  const items = [...first.items];

  const pageCount = Math.ceil(first.total / MAX_BACKEND_PAGE_SIZE);
  for (let page = 2; page <= pageCount; page += 1) {
    const next = await backendGet<BackendPage<T>>(pageUrl(page));
    items.push(...next.items);
  }

  return items;
}

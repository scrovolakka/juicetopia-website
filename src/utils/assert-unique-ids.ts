export function assertUniqueIds<T extends { slug: string; data: Record<string, unknown> }>(
  entries: T[],
  field: string,
  collection: string,
): void {
  const seen = new Map<string, string>();
  for (const e of entries) {
    const id = e.data[field] as string | undefined;
    if (!id) continue;
    const prev = seen.get(id);
    if (prev) {
      throw new Error(
        `[${collection}] duplicate ${field} "${id}": "${prev}" and "${e.slug}"`,
      );
    }
    seen.set(id, e.slug);
  }
}

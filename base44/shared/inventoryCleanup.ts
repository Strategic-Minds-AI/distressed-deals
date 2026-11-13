/** Safely inspect inventory. No status writes, entity updates or outbound URL probes.
 * Explicit correction for historical duplicate-withdrawal behavior:
 * sharing a ZIP or street does not establish property identity.
 */
import { auditInventoryRecords } from './inventoryAudit.js';
export async function cleanInventoryData(base44: any, opts: { validateImages?: boolean } = {}): Promise<any> {
  const items: any[] = [];
  let cursor: string | undefined;
  const cursors = new Set<string>();
  for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
    const page = await base44.asServiceRole.entities.Property.filter(
      {}, { limit: 500, sort: 'created_date', cursor }
    );
    if (!Array.isArray(page?.items)) throw new Error('Inventory audit aborted: invalid source page');
    items.push(...page.items);
    if (items.length > 50000) throw new Error('Inventory audit aborted: size limit exceeded');
    if (!page.has_more) {
      return auditInventoryRecords(items, { checkImageFormat: opts.validateImages === true });
    }
    if (!page.next_cursor || cursors.has(page.next_cursor)) {
      throw new Error('Inventory audit aborted: pagination cursor failed');
    }
    cursor = page.next_cursor;
    cursors.add(cursor);
  }
  throw new Error('Inventory audit aborted: page limit exceeded');
}

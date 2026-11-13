import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { validateAvailability } from '../../shared/availabilityValidation.ts';

/** Admin-only property evidence audit. This NEVER changes status or verified_at. */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let user: any;
    try {
      user = await base44.auth.me();
    } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden - admin only' }, { status: 403 });
    return Response.json(await validateAvailability(base44));
  } catch {
    return Response.json({ error: 'AVAILABILITY_AUDIT_FAILED' }, { status: 500 });
  }
}

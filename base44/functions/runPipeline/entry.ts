import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncSupabaseToEntities } from '../../shared/supabaseSync.ts';
import { assessPipelineSync } from '../../shared/pipelineGuard.js';
import { validateAvailability } from '../../shared/availabilityValidation.ts';
import { cleanInventoryData } from '../../shared/inventoryCleanup.ts';

/**
 * Administrative REVIEW pipeline. The external Railway worker has its own
 * secret-authenticated workerSync endpoint. No user session is NEVER evidence
 * of workflow authority; anonymous and failed auth must be denied.
 *
 * Any previously scheduled Base44 workflow that invokes this endpoint without a
 * user must use the authenticated workerSync route instead. Do not add duplicate
 * timers. No downstream inventory audit runs on an unverified source sync.
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let user: any;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden - admin only' }, { status: 403 });

    const startedAt = new Date().toISOString();
    const sync = await syncSupabaseToEntities(base44);
    const sourceGate = assessPipelineSync(sync);
    if (!sourceGate.canContinue) {
      // Even cleanup can expose/mutate current inventory if future code changes.
      // Do not run anything downstream when source identity or rights are UNKNOWN.
      return Response.json({
        status: 'source_verification_required',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        sync,
        gate: sourceGate,
        availability: { status: 'NOT_RUN', reason: 'SOURCE_GATE_BLOCKED' },
        cleanup: { status: 'NOT_RUN', reason: 'SOURCE_GATE_BLOCKED' },
        no_downstream_actions: true
      }, { status: 424 });
    }

    // Both activities are strictly review-only and write no listing status or
    // owner-contact information. They cannot prove property availability.
    const availability = await validateAvailability(base44);
    const cleanup = await cleanInventoryData(base44, { validateImages: false });

    return Response.json({
      status: 'review_only_pipeline_complete',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      sync,
      gate: sourceGate,
      availability,
      cleanup,
      note: 'No automatic sold/withdrawn/verified-available assertions. No outbound actions.'
    });
  } catch {
    return Response.json({ error: 'PIPELINE_FAILED', no_outbound_actions: true }, { status: 500 });
  }
}

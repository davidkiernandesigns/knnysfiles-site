import { guard } from '@/server/auth';
import { deleteInquiry, updateInquiry } from '@/server/inquiries';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const body = (await request.json().catch(() => ({}))) as { status?: string; notes?: string };
  if (!Number.isInteger(id)) return Response.json({ error: 'bad id' }, { status: 400 });
  return Response.json({ ok: await updateInquiry(id, body) });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: 'bad id' }, { status: 400 });
  await deleteInquiry(id);
  return Response.json({ ok: true });
}

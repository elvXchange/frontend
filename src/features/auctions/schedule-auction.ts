import { api } from '../../shared/components/shared';
export async function scheduleAuction(data: unknown, files?: File[]) {
  const excel = (files || []).find((f) =>
    f.name.toLowerCase().endsWith('.xlsx'),
  );
  const pdf = (files || []).find((f) =>
    f.name.toLowerCase().endsWith('.pdf'),
  );
  if (!excel || !pdf)
    throw new Error(
      'Attach both Terms Excel and Terms PDF before scheduling.',
    );
  const body = new FormData();
  body.append('payload', JSON.stringify(data));
  body.append('terms_excel', excel);
  body.append('terms_pdf', pdf);
  const zip = (files || []).find((f) =>
    f.name.toLowerCase().endsWith('.zip'),
  );
  if (zip) body.append('images_zip', zip);
  const extra = (files || []).find(
    (f) => f !== excel && f !== pdf && f !== zip,
  );
  if (extra) body.append('additional_terms', extra);
  return await api<{ id: string }>(
    '/workflow/schedule',
    'POST',
    body,
  );
}

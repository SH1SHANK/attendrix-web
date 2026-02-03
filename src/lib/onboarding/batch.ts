export type ParsedBatchId = {
  branch: string;
  batch: string;
  semester: string;
};

export function parseBatchId(batchID: string): ParsedBatchId | null {
  if (!batchID) return null;
  const match = batchID.toUpperCase().match(/^([A-Z]{2,4})(\d{2})(\d{2})$/);
  if (!match) return null;
  return {
    branch: match[1],
    batch: match[2],
    semester: match[3],
  };
}

export function formatBatchLabel(params: {
  batchID: string;
  semester?: number | string | null;
}) {
  const parsed = parseBatchId(params.batchID);
  if (!parsed) {
    const semesterLabel = params.semester ? `Semester ${params.semester}` : "Semester";
    return `${params.batchID} · ${semesterLabel}`;
  }

  const semesterNum = Number(parsed.semester);
  const semesterLabel = Number.isFinite(semesterNum)
    ? `Semester ${semesterNum}`
    : `Semester ${parsed.semester}`;
  return `${parsed.branch}${parsed.batch} · ${semesterLabel}`;
}

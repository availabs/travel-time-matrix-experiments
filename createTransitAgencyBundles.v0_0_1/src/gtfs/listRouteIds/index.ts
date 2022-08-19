import Database from "better-sqlite3";

export type ListCmdParams = {
  gtfsAgencySqlitePath: string;
};

export async function listAllRoutesForAgency(params: ListCmdParams) {
  const { gtfsAgencySqlitePath } = params;

  const db = new Database(gtfsAgencySqlitePath);

  const q = `
    SELECT DISTINCT
        route_id,
        route_short_name,
        route_long_name
      FROM routes
      ORDER BY 1
  `;

  const rows = db.prepare(q).all();

  console.table(rows);
}

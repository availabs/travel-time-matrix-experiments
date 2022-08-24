BEGIN ;

CREATE TABLE IF NOT EXISTS region_boundaries (
  region_boundary_name  TEXT PRIMARY KEY,

  metadata              TEXT NOT NULL
) ;

COMMIT ;

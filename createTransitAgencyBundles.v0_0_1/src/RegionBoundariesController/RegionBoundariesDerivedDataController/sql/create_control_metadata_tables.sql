BEGIN ;

CREATE TABLE IF NOT EXISTS region_boundaries (
  region_boundary_name  TEXT PRIMARY KEY,

  metadata              TEXT NOT NULL
) ;

CREATE TABLE IF NOT EXISTS region_bbox (
  region_boundary_name  TEXT PRIMARY KEY,

  min_lon               REAL NOT NULL,
  min_lat               REAL NOT NULL,
  max_lon               REAL NOT NULL,
  max_lat               REAL NOT NULL
) ;

COMMIT ;

BEGIN ;

CREATE TABLE IF NOT EXISTS osm_base_extract (
  osm_extract_region              TEXT NOT NULL,
  osm_map_date                    TEXT NOT NULL,

  PRIMARY KEY (osm_extract_region, osm_map_date)
) ;

CREATE TABLE IF NOT EXISTS osm_region_extracts (
  region_boundary_name            TEXT PRIMARY KEY,
  metadata                        TEXT NOT NULL
) ;

COMMIT ;

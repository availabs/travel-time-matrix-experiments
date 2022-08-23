BEGIN ;

CREATE TABLE IF NOT EXISTS osm_base_extract (
  osm_extract_region              TEXT NOT NULL,
  osm_map_date                    TEXT NOT NULL,

  PRIMARY KEY (osm_extract_region, osm_map_date)
) ;

CREATE TABLE IF NOT EXISTS osm_extracts (
  osm_extract_region              TEXT NOT NULL,
  osm_map_date                    TEXT NOT NULL,

  source_osm_extract_region       TEXT NOT NULL,
  bounding_polygon_id             INTEGER, -- Provenance of the Bounding Polygon

  PRIMARY KEY (osm_extract_region, osm_map_date)
) ;

COMMIT ;

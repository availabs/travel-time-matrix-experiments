BEGIN ;

-- These are like DataManager views. OSM Map is the source.
-- File naming convention is <osm_extract_region>-<osm_map_date.pbf

CREATE TABLE IF NOT EXISTS osm_pbfs (
  osm_extract_region    TEXT NOT NULL,
  osm_map_date          TEXT NOT NULL,

  PRIMARY KEY (osm_extract_region, osm_map_date)
) ;

COMMIT ;


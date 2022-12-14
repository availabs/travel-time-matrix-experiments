BEGIN ;

CREATE TABLE IF NOT EXISTS gtfs_agencies (
  gtfs_agency_name        TEXT PRIMARY KEY
) ;

CREATE TABLE IF NOT EXISTS gtfs_agency_feed_versions (
  gtfs_agency_name        TEXT PRIMARY KEY,

  gtfs_feed_version       TEXT NOT NULL,

  FOREIGN KEY(gtfs_agency_name)
    REFERENCES gtfs_agencies(gtfs_agency_name)
) ;

CREATE TABLE IF NOT EXISTS gtfs_stops_subsets (
  gtfs_stops_subset_name  TEXT PRIMARY KEY,

  metadata                TEXT NOT NULL
) ;

COMMIT ;

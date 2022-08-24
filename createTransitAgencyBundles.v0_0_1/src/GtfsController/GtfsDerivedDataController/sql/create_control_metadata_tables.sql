BEGIN ;

CREATE TABLE IF NOT EXISTS gtfs_agencies (
  gtfs_agency_name        TEXT PRIMARY KEY
) ;

CREATE TABLE IF NOT EXISTS gtfs_feeds (
  gtfs_agency_name        TEXT PRIMARY KEY,

  gtfs_feed_version       TEXT NOT NULL,

  FOREIGN KEY(gtfs_agency_name)
    REFERENCES gtfs_agencies(gtfs_agency_name)
) ;

COMMIT ;

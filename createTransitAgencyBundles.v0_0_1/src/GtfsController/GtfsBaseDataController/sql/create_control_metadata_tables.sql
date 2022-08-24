BEGIN ;

CREATE TABLE IF NOT EXISTS gtfs_feeds (
  -- User provided
  gtfs_agency_name        TEXT NOT NULL,
  gtfs_feed_version       TEXT NOT NULL,

  -- Derived from feed.
  gtfs_feed_start_date    TEXT NOT NULL,
  gtfs_feed_end_date      TEXT NOT NULL,

  gtfs_feed_file_name     TEXT NOT NULL UNIQUE,

  PRIMARY KEY (gtfs_agency_name, gtfs_feed_version)
) ;

COMMIT ;


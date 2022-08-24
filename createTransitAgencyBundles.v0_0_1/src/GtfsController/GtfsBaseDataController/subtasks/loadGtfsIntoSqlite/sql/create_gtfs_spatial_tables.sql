DROP TABLE IF EXISTS stop_points ;

CREATE TABLE stop_points (
  stop_id   TEXT PRIMARY KEY,
  feature   TEXT,

  CHECK (json_valid(feature))
) WITHOUT ROWID ;

INSERT INTO stop_points (
  stop_id,
  feature
)
  SELECT
      stop_id,
      json_set(
        '{
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": null
            },
            "properties": null
         }',

        '$.id',
        stop_id,

        '$.properties',
        json_object(
          'stop_id',              stop_id,
          'stop_code',            stop_code,
          'stop_name',            stop_name,
          'stop_desc',            stop_desc,
          'zone_id',              zone_id,
          'stop_url',             stop_url,
          'location_type',        location_type,
          'stop_timezone',        stop_timezone,
          'wheelchair_boarding',  wheelchair_boarding
        ),

        '$.geometry.coordinates',
        json_array(stop_lon, stop_lat)
      ) AS feature
    FROM stops
    WHERE (
      ( stop_lon IS NOT NULL )
      AND
      ( stop_lat IS NOT NULL )
    )
;


DROP TABLE IF EXISTS shape_linestrings ;

CREATE TABLE shape_linestrings (
  shape_id     TEXT PRIMARY KEY,
  feature      TEXT,

  CHECK (json_valid(feature))
) WITHOUT ROWID;

INSERT INTO shape_linestrings
  SELECT
      shape_id,
      create_shape_linestring( -- User-defined function
        shape_id,
        json_group_array(
          json_object(
            'coordinate',           json_array( shape_pt_lon, shape_pt_lat ),
            'shape_dist_traveled',  shape_dist_traveled,
            'shape_pt_sequence',    shape_pt_sequence
          )
        )
      ) AS feature
    FROM shapes
    GROUP BY shape_id
;

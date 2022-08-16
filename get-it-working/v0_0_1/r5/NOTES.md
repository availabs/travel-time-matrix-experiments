Used the old instructions: [RunningConveyalR5](https://github.com/availabs/conveyal-analysis-experiments/blob/54ef84abd33755873c59bdba10a2f8a3ef545b81/documenation/RunningConveyalR5.md)

```sh
$ cd r5
$ git checkout 43068e168138bc5636d895861209c1c0049e0f1a
$ gradle clean build shadowJar -x test

Starting a Gradle Daemon, 1 incompatible Daemon could not be reused, use --status for details

FAILURE: Build failed with an exception.

* Where:
Build file '/home/paul/AVAIL/conveyal-travel-time-matrix/r5/build.gradle'

* What went wrong:
Could not compile build file '/home/paul/AVAIL/conveyal-travel-time-matrix/r5/build.gradle'.
> startup failed:
  General error during semantic analysis: Unsupported class file major version 61

  java.lang.IllegalArgumentException: Unsupported class file major version 61

...
```

```sh
$ sdk upgrade
Available defaults:
gradle (local: 2.2.1, 7.1.1, 6.9, 7.2, 5.5.1; default: 7.5.1)
java (local: 11.0.11.hs-adpt, 8.0.302-open, 11.0.12-open, 17.0.3-tem, 16.0.2-open; default: 17.0.4-tem)
maven (local: 3.8.2; default: 3.8.6)

Use prescribed default version(s)? (Y/n):

Downloading: gradle 7.5.1

In progress...
################################################################################ 100.0%

Done installing!

Setting gradle 7.5.1 as default.

Downloading: java 17.0.4-tem

In progress...
################################################################################ 100.0%

Repackaging Java 17.0.4-tem...

Done repackaging...

Installing: java 17.0.4-tem
Done installing!


Setting java 17.0.4-tem as default.

Downloading: maven 3.8.6

In progress...
################################################################################ 100.0%

Installing: maven 3.8.6
Done installing!


Setting maven 3.8.6 as default.
```

```
$ gradle clean build shadowJar -x test

Welcome to Gradle 7.5.1!

Here are the highlights of this release:
 - Support for Java 18
 - Support for building with Groovy 4
 - Much more responsive continuous builds
 - Improved diagnostics for dependency resolution

For more details see https://docs.gradle.org/7.5.1/release-notes.html

Starting a Gradle Daemon (subsequent builds will be faster)

> Task :compileJava
/home/paul/AVAIL/conveyal-travel-time-matrix/r5/src/main/java/com/conveyal/r5/util/Histogram.java:114: warning: [removal] Integer(int) in Integer has been deprecated and marked for removal
        String start = new Integer(minBin).toString();
                       ^
/home/paul/AVAIL/conveyal-travel-time-matrix/r5/src/main/java/com/conveyal/r5/util/Histogram.java:116: warning: [removal] Integer(int) in Integer has been deprecated and marked for removal
        String end = new Integer(maxBin).toString();
                     ^
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
2 warnings

> Task :shadowJar FAILED
ex
groovy.lang.MissingPropertyException: No such property: count for class: com.github.jengelman.gradle.plugins.shadow.
transformers.ServiceFileTransformer
```

[S.O. Answer](https://stackoverflow.com/a/67380597/3970755)

```diff
diff --git a/build.gradle b/build.gradle
index 107398f2..21fba007 100644
--- a/build.gradle
+++ b/build.gradle
@@ -1,6 +1,6 @@
 plugins {
     id 'java'
-    id 'com.github.johnrengelman.shadow' version '6.0.0'
+    id 'com.github.johnrengelman.shadow' version '7.0.0'
     id 'maven-publish'
     id 'com.palantir.git-version' version '0.12.3'
 }
```

### BUILD SUCCESS

```sh
gradle clean build shadowJar -x test

> Task :compileJava
/home/paul/AVAIL/conveyal-travel-time-matrix/r5/src/main/java/com/conveyal/r5/util/Histogram.java:114: warning: [removal] Integer(int) in Integer has been deprecated and marked for removal
        String start = new Integer(minBin).toString();
                       ^
/home/paul/AVAIL/conveyal-travel-time-matrix/r5/src/main/java/com/conveyal/r5/util/Histogram.java:116: warning: [removal] Integer(int) in Integer has been deprecated and marked for removal
        String end = new Integer(maxBin).toString();
                     ^
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
2 warnings

Deprecated Gradle features were used in this build, making it incompatible with Gradle 8.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

See https://docs.gradle.org/7.5.1/userguide/command_line_interface.html#sec:command_line_warnings

BUILD SUCCESSFUL in 17s
6 actionable tasks: 6 executed
```

```sh
$ ls build/libs
r5-v6.7.dirty-all.jar  r5-v6.7.dirty.jar
```

```sh
$ docker build . --build-arg r5version=$(cat build/resources/main/com/conveyal/r5/version.txt) --tag local-conveyal-r5:6.7

Sending build context to Docker daemon  142.3MB
Step 1/9 : FROM openjdk:11
 ---> 47a932d998b7
Step 2/9 : ARG r5version
 ---> Using cache
 ---> 7e7042cdd637
Step 3/9 : ENV R5_VERSION=$r5version
 ---> Running in 04cbf11dfcc5
Removing intermediate container 04cbf11dfcc5
 ---> 47d42c37744a
Step 4/9 : ENV JVM_HEAP_GB=2
 ---> Running in 324237ffc281
Removing intermediate container 324237ffc281
 ---> 76c39be35d7e
Step 5/9 : WORKDIR /r5
 ---> Running in b9e517fda8b3
Removing intermediate container b9e517fda8b3
 ---> 65e98f17e09b
Step 6/9 : COPY build/libs/r5-${R5_VERSION}-all.jar .
 ---> f886a43073e8
Step 7/9 : COPY analysis.properties.docker analysis.properties
 ---> de82c14bfb66
Step 8/9 : EXPOSE 7070
 ---> Running in 9a632c0dea64
Removing intermediate container 9a632c0dea64
 ---> b04f97f1ac94
Step 9/9 : CMD java -Xmx${JVM_HEAP_GB}g -cp r5-${R5_VERSION}-all.jar com.conveyal.analysis.BackendMain
 ---> Running in 53f9fcf3c696
Removing intermediate container 53f9fcf3c696
 ---> 9c1ffaacd123
Successfully built 9c1ffaacd123
Successfully tagged local-conveyal-r5:6.7
```

```diff
diff --git a/analysis.properties.docker b/analysis.properties.docker
index f1f8c79d..50539e97 100644
--- a/analysis.properties.docker
+++ b/analysis.properties.docker
@@ -1,8 +1,9 @@
 # When running in docker, we reference services running on other containers
 # The database is given the hostname mongo by the docker-compose links section
-database-uri=mongodb://mongo:27017
+database-uri=mongodb://root:ava1l1en@mongo:27017/analysis?authSource=admin
 database-name=analysis
 frontend-url=https://ui:3000
+access-control-allow-origin=*
 bundle-bucket=analysis-local-bundles
 grid-bucket=analysis-local-grids
 results-bucket=analysis-local-results
@@ -15,3 +16,4 @@ local-cache=cache
 light-threads=3
 heavy-threads=3
 max-workers=8
+immediate-shutdown=false
```

```diff
diff --git a/docker-compose.yml b/docker-compose.yml
index 3e2da62c..5fb8da49 100644
--- a/docker-compose.yml
+++ b/docker-compose.yml
@@ -5,30 +5,14 @@ version: '3'
 services:
   r5:
     container_name: r5
-    build: .
-    # image: ghcr.io/conveyal/r5:latest
+    image: local-conveyal-r5:6.7
     depends_on:
       - mongo
     links:
       - mongo
     ports:
       - "7070:7070"
-    # TODO volumes for backend cache directory
-  ui:
-    container_name: ui
-    depends_on:
-      - mongo
-    # build: ../analysis-ui
-    # image: ghcr.io/conveyal/analysis-ui:latest
-    image: 037a38bb2cdf
-    ports:
-      - "3000:3000"
-    links:
-      - r5
-      - mongo
-    # Map in a config file with mapbox keys, telling the UI to contact host (container) r5
-    volumes:
-      - ./ui-env:/ui/.env.local:ro
+
   mongo:
     container_name: mongo
     image: mongo
@@ -37,6 +21,9 @@ services:
       - mongo-volume:/data/db:rw
     ports:
       - "27017:27017"
+    environment:
+      - MONGO_INITDB_ROOT_USERNAME=root
+      - MONGO_INITDB_ROOT_PASSWORD=ava1l1en

 volumes:
   mongo-volume:
```

```sh
root@2113485ce55d:/# mongo
MongoDB shell version v5.0.2
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("600db79f-2ac3-4494-889f-bd661b97dd89") }
MongoDB server version: 5.0.2
================
Warning: the "mongo" shell has been superseded by "mongosh",
which delivers improved usability and compatibility.The "mongo" shell has been deprecated and will be removed in
an upcoming release.
We recommend you begin using "mongosh".
For installation instructions, see
https://docs.mongodb.com/mongodb-shell/install/
================
---
The server generated these startup warnings when booting:
        2022-08-15T21:12:46.404+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
        2022-08-15T21:12:47.155+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
---
---
        Enable MongoDB's free cloud-based monitoring service, which will then receive and display
        metrics about your deployment (disk utilization, CPU, operation statistics, etc).

        The monitoring data will be available on a MongoDB website with a unique URL accessible to you
        and anyone you share the URL with. MongoDB may use this information to make product
        improvements and to suggest MongoDB products and deployment options to you.

        To enable free monitoring, run the following command: db.enableFreeMonitoring()
        To permanently disable this reminder, run the following command: db.disableFreeMonitoring()
---
> show dbs
admin     0.000GB
analysis  0.000GB
config    0.000GB
local     0.000GB
> use analysis
switched to db analysis
> show collections
bundles
projects
regions
> db.bundles.findOne()
{
        "_id" : "62fab46011f4f532bc24d4cf",
        "name" : "CDTA Test 1",
        "nonce" : "62fab46011f4f532bc24d4d0",
        "createdAt" : ISODate("2022-08-15T21:02:24.318Z"),
        "updatedAt" : ISODate("2022-08-15T21:02:24.318Z"),
        "accessGroup" : "local",
        "createdBy" : "local",
        "updatedBy" : "local",
        "regionId" : "62fab41aeab14813181243f7",
        "osmId" : "62fab46011f4f532bc24d4d1",
        "feedGroupId" : "62fab46411f4f532bc24d4d2",
        "north" : 43.295145,
        "south" : 42.467067,
        "east" : -73.60739,
        "west" : -74.03361,
        "serviceStart" : "2019-10-09",
        "serviceEnd" : "2020-01-25",
        "feeds" : [
                {
                        "feedId" : "62fab46511f4f532bc24d4d3",
                        "name" : "CDTA: 2019-09-01 to 2020-01-25",
                        "bundleScopedFeedId" : "62fab46511f4f532bc24d4d3_62fab46411f4f532bc24d4d2",
                        "serviceStart" : "2019-10-09",
                        "serviceEnd" : "2020-01-25",
                        "checksum" : NumberLong(749672044),
                        "errors" : [ ]
                }
        ],
        "status" : "DONE",
        "feedsComplete" : 1,
        "totalFeeds" : 1
}
> db.projects.findOne()
{
        "_id" : "62fab488eab14813181243f9",
        "bundleId" : "62fab46011f4f532bc24d4cf",
        "name" : "CDTA Travel Time Matrix",
        "regionId" : "62fab41aeab14813181243f7",
        "variants" : [
                "Default"
        ],
        "accessGroup" : "local",
        "nonce" : "62fab488eab14813181243fa",
        "createdBy" : "local",
        "updatedBy" : "local"
}
> db.regions.findOne()
{
        "_id" : "62fab41aeab14813181243f7",
        "name" : "CDTA",
        "description" : "Test",
        "bounds" : {
                "north" : 43.05885,
                "south" : 42.36869,
                "east" : -73.2486,
                "west" : -74.25385
        },
        "accessGroup" : "local",
        "nonce" : "62fab41aeab14813181243f8",
        "createdBy" : "local",
        "updatedBy" : "local"
}
```

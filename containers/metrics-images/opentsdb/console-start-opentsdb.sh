#!/bin/bash

echo "export TSDB_TABLE_TTL=\"${TSDB_TABLE_TTL}\"" > /opt/opentsdb/tsdb_table_ttl

/init


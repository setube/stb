#!/bin/sh

echo "等待MongoDB准备就绪..."

until mongo --host mongodb --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do
  echo "MongoDB还没有准备好。等待..."
  sleep 2
done

echo "MongoDB准备好了"
exec "$@"
#!/bin/sh

container_id=`docker ps | grep datalab | grep -o '[0-9a-f]\{10,15\}'`

if [ "$container_id" != "" ]; then
	echo "stopping container $container_id"
	docker stop $container_id
fi

cd ../..
source ./tools/initenv.sh
cd sources
./build.sh
cd $REPO_DIR/containers/datalab
./build.sh
cd $REPO_DIR/containers/datalab
./run.sh

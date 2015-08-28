#!/bin/bash

if [[ $# -gt 0 && ( $1 = "--help" || $1 != "container" ) ]]; then
	printf "\nusage $0 [container | --help] \n\tcontainer : run the container only \n\t--help : show this message\n"
	exit 1
fi

if [ "$1" = "container" ]; then
	cd $REPO_DIR/containers/datalab/ && ./run.sh
else
	# remove previous build if present
	cd $REPO_DIR && rm -rf build
	printf "Removed last build.\nBuilding locally..."
	# build locally
	cd $REPO_DIR/sources && ./build.sh &> /dev/null
	printf "Finished local build.\nBuilding container and starting the container..."
	# build and run container
	cd $REPO_DIR/containers/datalab/ && ./build.sh &> /dev/null && ./run.sh
fi 
	
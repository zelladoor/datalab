#!/bin/bash
set -o errexit; # Fail build on first error, instead of carrying on by default

if [ -z "$REPO_DIR" ];
  then echo "REPO_DIR is not set. Please run source tools/initenv.sh first";
  exit 1;
fi

### CONFIG
# Create all of the output paths
build_root="$REPO_DIR/build/server";
# TODO(bryantd): using an additonal directory '_' to offset the build path such that
# the hard-coded dependency paths (dictated by TypeScript module system currently) will
# line up with the source directory layout. Current issue is that the source code needs
# to be compiled in multiple locations, each of which must have the correct number of parent
# directories to the externs/ts typedefs. One workaround would be to symlink externs/ts
# to each build location and then change all import references to account for this.
#
# All of this trickery would be unnecessary if TypeScript supported a requirejs-style path config
# specification, but it does not at the moment.
#
# This module path config feature is being actively discussed within the TypeScript community, so
# opting to see how it plays out before implementing more complex work-arounds. For discussion,
# see: https://github.com/Microsoft/TypeScript/issues/293
staging_path="$build_root/staging";
ui_staging_path="$staging_path/ui";
node_staging_path="$staging_path/node";
test_path="$build_root/tests";
build_path="$build_root/build";

# Define the source path
server_root="$REPO_DIR/sources/server";

# TypeScript compiler args for both backend and frontend code
common_tsc_args="--removeComments --noImplicitAny";

mkdir -p "$ui_staging_path" "$node_staging_path" "$build_path" "$test_path";


### BUILD
# NodeJS backend compilation in staging
echo 'Building DataLab server backend...';
# Copy node .ts files to the backend staging area.
cp -r "$server_root/src/node/" "$node_staging_path";
# Copy shared .ts files to the backend staging area.
cp -r "$server_root/src/shared" "$node_staging_path/app";
# Compile the typescript code in staging.
node_tsc_files=`find $node_staging_path -name '*.ts' | tr '\n' ' '`;
tsc $common_tsc_args --module commonjs $node_tsc_files;

# UI compilation in staging
echo 'Building DataLab server frontend...';
# Copy UI .ts files to the frontend staging area.
cp -r "$server_root/src/ui/" "$ui_staging_path";
# Copy shared .ts files to the frontend staging area.
cp -r "$server_root/src/shared" "$ui_staging_path/scripts/app";
# Compile the typescript code in staging.
ui_tsc_files=`find $ui_staging_path -name '*.ts' | tr '\n' ' '`;
tsc $common_tsc_args --module commonjs $ui_tsc_files;

# Merge the compiled backend and frontend components into a single build where NodeJS is serving
# the static UI content directly.
#
# Copy the compiled backend .js from staging to the server build.
cp -r $node_staging_path/* $build_path;
# Copy the built UI with static assets to the /static content path of the server build.
# cp -r $ui_staging_path/* $build_path/static;
# Remove the unneeded .ts files from the build path (both ui and node).
find "$build_path" -name '*.ts' | xargs rm;


### TEST
# TODO(bryantd): Find a way to avoid needing to rebuild the src/* .ts files when compiling tests
# Best solution likely involves generating the *.d.ts typedefs when building /src/* and correctly
# symlinking these built files to the test directory, before building the tests.
echo 'Testing DataLab server backend...';
# Copy node .ts files to test.
cp -r "$server_root/src/node" "$test_path";
# Copy shared .ts files to the test area.
cp -r "$server_root/src/shared" "$test_path/node/app";
# Copy the test .ts files to the test area.
cp -r "$server_root/tests/node/" "$test_path/node";
# Compile the typescript code in test area (src and tests).
test_tsc_files=`find $test_path/node -name '*.ts' | tr '\n' ' '`;
tsc $common_tsc_args --module commonjs $test_tsc_files;
# Install the npm dependencies
echo 'Installing NPM dependencies for running the unit tests'
pushd "$test_path/node";
# Install the source code dependencies
npm install .;
# Now run the tests via the jasmine-node runner
jasmine-node .;
popd;

echo 'Done!'

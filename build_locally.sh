
if [ "$1" = "init" ]; then
	# ----------- Init Script----------
	printf "Installing the virtual environment...\n" &&
	cd $REPO_DIR && virtualenv --no-site-packages testenv &&
	source $REPO_DIR/testenv/bin/activate &&
	
	printf "Installing the python dependencies...\n"
	pip install ipython==2.4.1 futures==3.0.3 httplib2==0.9.1 oauth2client==1.4.12 pandas==0.16.2 py-dateutil==2.2 requests==2.4.3 &> /dev/null &&


	# # create testing profile
	printf "Creating IPython profile...\n" &&
	ipython profile create testing_profile &&


	# # install the magic libraries
	printf "Installing magic libraries...\n" &&
	pip install $VIRTUAL_ENV/../sources/lib/api/ &&
	pip install $VIRTUAL_ENV/../sources/lib/datalab/ &&


	# # Add extension to include gcp.datalab
	printf "Adding magic libraries to startup script...\n" &&
	echo c.InteractiveShellApp.extensions = [ \'gcp.datalab\' ] >> ~/.ipython/profile_testing_profile/ipython_config.py &&
	
	deactivate && 

	echo 'Finished setup.'

elif [ "$1" = "del" ]; then
	printf "Deleting local build setup...\n"
	# -------------Delete the local build setup -----------------
	# Delete virtual environment.
	printf "Deleting virtual environment...\n"
	rm -rf $REPO_DIR/testenv
	# Delete the IPython profile.
	printf "Deleting IPython profile...\n"
	rm -rf ~/.ipython/profile_testing_profile/

elif [ "$1" = "-h" ]; then
	printf "Usage $0 [init | update | del]\n"

elif [ "$1" = "update" ]; then
	printf "Updating libraries...\n"

	# ------------- Update the libraries --------
	# Activate the virtual environment
	cd $REPO_DIR && source testenv/bin/activate

	# uninstall libraries
	pip uninstall GCPDataLab -y &> /dev/null && 
	pip uninstall GCPData -y &> /dev/null && 
	pip install $VIRTUAL_ENV/../sources/lib/api/ && pip install $VIRTUAL_ENV/../sources/lib/datalab/

	deactivate

else
	printf "Startig local IPython...\n"
	# ------------ Execute IPython -------------
	# Activate the virtual environment
	source $REPO_DIR/testenv/bin/activate
	# Start IPython
	ipython --profile testing_profile
	deactivate
fi
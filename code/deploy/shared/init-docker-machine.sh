#!/bin/bash
set -e


### Fix known Ubuntu configuration problems ###
export LANG=C.UTF-8
export LC_ALL=C.UTF-8
locale-gen C.UTF-8
update-locale LANG=C.UTF-8 LC_ALL=C.UTF-8


### Install helpful diagnostic tools ###
apt-get update
apt-get install -y net-tools swaks


### Install Docker using the official repository ###
# Add Docker's official GPG key
# already # apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update

# Install Docker packages
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin


### Summarize ###
echo "Docker with compose installed successfully"

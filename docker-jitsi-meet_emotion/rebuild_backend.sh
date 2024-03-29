#!/bin/bash
REPO_ROOT=~/dev/work/github/docker-jitsi-meet_emotion
JITSI_MEET_DIR=~/dev/work/github/jitsi-meet_emotion
JITSI_MEET_CONFIG_DIR=~/.jitsi-meet-cfg

echo "Building Jitsi-Meet packages from source ..." && sleep 1

cd $JITSI_MEET_DIR || { echo "Failed to find $JITSI_MEET_DIR"; exit 1; }
make || { echo "Make failed"; exit 1; }
make source-package || { echo "Make source-package failed"; exit 1; }

echo "Moving and unzipping Jitsi-Meet package archive into Docker build context" && sleep 1

mv $JITSI_MEET_DIR/jitsi-meet.tar.bz2 $REPO_ROOT/web || { echo "Failed to move packages to destination"; exit 1; }
cd $REPO_ROOT/web || { echo "Failed to find $REPO_ROOT/Web"; exit 1; }
tar -xvf jitsi-meet* || { echo "Failed to unzip archive"; exit 1; }
rm -rf $REPO_ROOT/web/jitsi-meet.tar.bz2

echo "Rebuilding Jitsi-Meet web Docker image" && sleep 1

sudo docker build --build-arg JITSI_RELEASE=unstable --progress plain --tag erge234/web . || { echo "Docker operation failed"; exit 1; }
rm -rf $REPO_ROOT/web/jitsi-meet 

echo "Taking down the Docker container stack" && sleep 1

cd $REPO_ROOT || { echo "Failed to find $REPO_ROOT"; exit 1; }
sudo docker-compose down 

echo "Removing and recreating Jitsi-Meet config directories" && sleep 1

sudo rm -rf $JITSI_MEET_CONFIG_DIR || { echo "Failed to remove $JITSI_MEET_CONFIG_DIR"; exit 1; }
mkdir -p $JITSI_MEET_CONFIG_DIR/{web/letsencrypt,transcripts,prosody/config,prosody/prosody-plugins-custom,jicofo,jvb,jigasi,jibri} || { echo "Failed to create required config directories at $JITSI_MEET_CONFIG_DIR root"; exit 1; }
cp $REPO_ROOT/custom-config.js $JITSI_MEET_CONFIG_DIR/web
echo "Rebuilding Jitsi-Meet web Docker container and bringing up Docker container stack" && sleep 1

cd $REPO_ROOT || { echo "Failed to find $REPO_ROOT"; exit 1; }
./gen-passwords.sh
docker-compose up -d || { echo "Docker operation failed"; exit 1; }

echo "Back-end is up"
# echo "Use compose-up to start the back-end"

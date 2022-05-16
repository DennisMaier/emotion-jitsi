FROM jitsi/web:stable-7001
COPY jitsi-meet/ /usr/share/jitsi-meet
COPY jitsi-meet/interface_config.js /defaults/interface_config.js
EXPOSE 80 443

VOLUME ["/config", "/usr/share/jitsi-meet/transcripts"]
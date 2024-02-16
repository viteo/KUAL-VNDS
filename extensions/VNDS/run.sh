sqlite3 /var/local/appreg.db "INSERT INTO handlerIds VALUES ('com.waf.vnds')"
sqlite3 /var/local/appreg.db "INSERT INTO properties (handlerId, name, value) VALUES ('com.waf.vnds','command','/usr/bin/mesquite -l com.waf.vnds -c /mnt/us/extensions/VNDS/files/')"
sqlite3 /var/local/appreg.db "INSERT INTO properties (handlerId, name, value) VALUES ('com.waf.vnds','unloadPolicy','unloadOnPause');"


pkill vndseventlistener
pkill vndsaudiokiller

cd /mnt/us/extensions/VNDS/files
./vndseventlistener &
./vndsaudiokiller &
cd /

ls /mnt/us/extensions/VNDS/files/games > /mnt/us/extensions/VNDS/files/gamelist

lipc-set-prop com.lab126.appmgrd start app://com.waf.vnds

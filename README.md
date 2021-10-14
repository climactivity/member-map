# member-map
List geolocation of members in network
Die Leaflet Abhängigkeit wird direkt included, man braucht also kein NPM dafür. Man braucht nicht mal einen lokalen Webserver. Einfach die html-Datei in einem Browser öffen


# Installation/Update

1. Die `css` und `js`-Ordner in den `static/`-Ordner im Wordpress-Verzeichnis kopieren. 
    
    `update.sh` automatisiert dies einigermaßen. Setz einen Eintrag in `.ssh/config` der auf den WP-Server zeigt und hinterleg das in .env     

2. Copy-Paste wp-shell.html in den member-map Artikel in Wordpress (ja, wirklich, help; ich hoffe das braucht man nicht so oft)
    * `index.html` war für lokales Testen und erfordert eine eigene installation von WP/Buddy-Boss, ich weiß auch nur noch so halb wie das ging 

# Bekannte Probleme 

- die Installation/Pflege ist schwierig und das einbetten auf Unterseiten ist... hmm. Ein Ziel sollte sein, das mehr mit Wordpress zu integrieren
- page size der buddy boss api (see https://www.buddyboss.com/resources/api/#api-Members-GetBBMembers)
- die Größe der Member-Map ist zu klein, aber `leaflet` hat Probleme mit %-Größen im css
- irgendwas mit `get_headers()` wenn man auf ein Profil klickt. Scheint keine Funktionalität zu beeinflussen, sieht aber nicht gut aus. (Anm. Timo: Ich kriege den Fehler nicht wiederholbar reproduziert) 
- die Postleitzahlen-Koordinaten-Generierung ist ein Haufen Spaghetti ohne offensichtliche Methodik um an neue Geodaten zu kommen. Aus _convenience_-Gründen liegt die `.geojson`-Datei mit allen Postleitzhalen-Polygonen in geo-data, zusammen mit dem Skript um daraus `plz.js` zu machen
- Die wpApiSetting werden nur geladen wenn man als Admin eingeloggt ist. Wir müssen entweder die nonce anders bekommen oder die Security von dem API-Endpunkt für Member abändern.

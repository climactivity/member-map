
const ACCESS_TOKEN = "pk.eyJ1IjoidGltb3ZvbGsiLCJhIjoiY2tmbWt1bGZwMDZndDJzcGwybng1d3I1ciJ9.PYYJgE9ZANvQB9QuHOfFCQ"; // das sollte hier nicht rumliegen
const BB_API_BASE_URL = "https://climactivity-netzwerk.de/wp-json"; // danke Melanie
const OPEN_STREETMAP_API = 'https://nominatim.openstreetmap.org/search?format=json&q=';


/**
 * Holt die Benutzerdaten zur darstellung auf der Map aus der Buddyboss-API 
 * Die Docs der API liegen hier @see https://www.buddyboss.com/resources/api/#api-Members-GetBBMembers
 * @returns Promise mit den ersten 100 Benutzerprofilen
 */
async function getMemberList() {

    // nur die Daten, die wir auch brauchen erfassen mit xprofile string 
    var params = {
        xprofile: "Über mich",
        per_page: 100
    }

    return await fetch(`${BB_API_BASE_URL}/buddyboss/v1/members${params ? `?${new URLSearchParams(params)}` : ""}`, {
        credentials: 'include',
        headers: {
            'Access-Control-Allow-Origin' : '*',
            'Content-Type': 'application/json',
            'X-WP-Nonce' : wpApiSettings.nonce // ohne das ist man für Wordpress nicht angemeldet
        }
    })
        .then(response => response.json())

}

/**
 * Holt das eigene Profil; noch nicht verwendet, falls wir eine Karte im Profil
 * einbetten wäre das hier um die eigene PLZ zu finden und die Karte zu zentrieren
 * @returns Promise mit den eigenen Profildaten
 */
async function getOwnLocation() {

    return await fetch(`${BB_API_BASE_URL}/buddyboss/v1/account-settings`, {
        credentials: 'include',
        headers: {
            'Access-Control-Allow-Origin' : '*',
            'Content-Type': 'application/json',
            'X-WP-Nonce' : wpApiSettings.nonce
        }
    })
        .then(response => response.json())

}

/**
 * Ruf die Geodaten einer Postleitzahl ab. Falls diese nicht in plz.js gespeichert 
 * ist, fall auf die Open-Streetmap-API zurück (langsam)
 * @param {string} plz 
 * @returns {lat, lon, name} Geodaten (latitude, longitude) und Name der Postleitzahl 
 */
async function getLocationForPlz(plz) {

    //console.log(plz)
    if (plzs.plzs.hasOwnProperty(plz)) {
        let data = plzs.plzs[plz];
        return {
            "lat": data.l[0],
            "lon": data.l[1],
            "name": data.n
        }

    } else {
        console.warn(`${plz} missing from geo data, fetching from slow fallback`)
        return await fetch(`${OPEN_STREETMAP_API}${plz}`, {
        })
            .then(response => response.json()[0])
    }

}

/**
 * Öffnet das Nutzerprofil des Angeklickten Markers in einem neuen Tab
 * @param {Event} e 
 */
function markerClicked(e) {
    console.log(e)
    var win = window.open(e.target.options.ref, '_blank');
    win.focus();
}

/**
 * Initalisiert eine neue leaflet-map 
 * TODO: die set-view Parameter sollten noch veränderbar sein, diese steuern wo 
 * die Map zentriert ist und wie weit reingezoomt ist. Das nicht das ganze
 * plz Gebiet zu sehen ist war schon mal ein Problem und mit de Geo-Koordinaten
 * kann man den aktuellen Nutzer zentrieren
 * @returns Das Leaflet map Objekt
 */
function initMap() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    let zoomLevel = (vh > 1000) ? 7 : 8;
    var mymap = L.map('leaflet-map').setView([51.94, 10.26], 7);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: ACCESS_TOKEN
    }).addTo(mymap);
    return mymap;
}

/**
 * Fügt die erzeugten Marker der Karte hinzu 
 * @param {[Marker]} markers 
 * @param {leaflet map} map 
 */
function initMarkerClusters(markers, map) {
    var markerCluster = L.markerClusterGroup();
    markers.map(marker => {
        markerCluster.addLayer(L.marker(marker.latlong, marker.options).on('click', markerClicked));
    })
    map.addLayer(markerCluster);
}

/**
 * Baut die Map und erzeugt die Marker. Die Daten für die Marker kommen aus der 
 * Buddyboss xprofile-Struktur. Die Felder zu finden war trial-and-error 
 * (request machen, ganzes Profil loggen und die Felder finden die man braucht). 
 * 
 * Div-Icons werden benutzt, damit wir den Markern unterschiedliches Aussehen abh.
 * von der Nutzerrolle und Profildaten mit css geben können, sonst müsste man 
 * dafür verschiedene Bilder hinterlegen 
 *    
 */
async function initMemberMap() {
    var mymap = initMap();

    let members = await getMemberList();
    let markers = await Promise.all(members.map(async m => {
        let plz = m.xprofile.groups["1"].fields["22"] ? m.xprofile.groups["1"].fields["22"].value.raw : "";
        let name = m.xprofile.groups["1"].fields["1"].value.raw;
        if (plz != "") {
            let location = (await getLocationForPlz(plz));
            if (location) {
                var options = { title: name, ref: m.link };
                var icon = L.divIcon( {
                     className: m.member_types.hasOwnProperty("mitglied") ? 'map-marker-plus' : 'map-marker',
                     iconUrl: m.avatar_urls.thumb,
                     iconSize: [38, 38],  
                     html: `<img style="width: 100%; height: 100%;"
                     src="${m.avatar_urls.thumb}"
                     alt="${name}"/>`
                })

                options = {...options, icon}

                return {
                    plz,
                    latlong: [location.lat, location.lon],
                    options,
                }
            }
        } else {
            // TODO: Mach was, falls eine Postleitzahl fehlt?
        }
    }));
    markers = markers.filter(m => m != undefined);
    initMarkerClusters(markers, mymap)
    document.querySelector('#spinner').remove(); // entferne den Lade-Spinner, nicht unwichtig
}

/**
 * Warte darauf, das die Wordpress-Api-Settings im scope sind. Das passiert nach
 * page-load in einem AJAX-Call. Wir brauchen diese Settings um die WP-Nonce 
 * zu finden, die der API signalisiert das wir kein böser XSS-Angriff oder 
 * ähnliches sind
 * @param {function} callback
 * @param {number} attempts wie oft 
 * @param {number} timeout in ms, timeout * attempts = gesammte Grace-Period für wpApiSettings
 * @returns 
 */
function wpApiHasLoaded(callback, attempts, timeout) {
    if (attempts < 0) {
        console.log("Failed to load wpApiSettings");
        return
    }
    if (typeof wpApiSettings === 'undefined') {
        setTimeout(() => {
            wpApiHasLoaded(callback, attempts - 1, timeout)
        }, timeout);
    } else {
        callback();
    }
}

// Jetzt machen wir auch mal was, yay!
wpApiHasLoaded( initMemberMap, 10, 100 );
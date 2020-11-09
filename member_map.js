
const ACCESS_TOKEN = "pk.eyJ1IjoidGltb3ZvbGsiLCJhIjoiY2tmbWt1bGZwMDZndDJzcGwybng1d3I1ciJ9.PYYJgE9ZANvQB9QuHOfFCQ";
const BB_API_BASE_URL = "https://climactivity.de/wp-json";
const OPEN_STREETMAP_API = 'https://nominatim.openstreetmap.org/search?format=json&q=';

async function getMemberList() {

    // nur die Daten, die wir auch brauchen erfassen mit xprofile string 

    var params = {
        xprofile: "Über mich",
        per_page: 100
    }

    return await fetch(`${BB_API_BASE_URL}/buddyboss/v1/members${params ? `?${new URLSearchParams(params)}`:""}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    })
        .then(response => response.json())

}

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

function markerClicked(e) {
    console.log(e)
    var win = window.open(e.target.options.ref, '_blank');
    win.focus();
}

function initMap() {
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

function initMarkers(markers, map) {

    markers.map(marker => {
        L.marker(marker.latlong, marker.options).addTo(map);
    })
}

function initMarkerClusters(markers, map) {

    /*
    let markerClusters = {}
    markers.map(marker => {
        if(!markerClusters.hasOwnProperty(marker.plz)) {
            markerClusters[marker.plz] = [];
        } 
        markerClusters[marker.plz].push(marker);
    }); 
    */

    var markerCluster = L.markerClusterGroup(); 
    markers.map(marker => {
        markerCluster.addLayer( L.marker(marker.latlong, marker.options).on('click', markerClicked) );
    })
    map.addLayer(markerCluster);
    document.querySelector('#spinner').remove()


}

async function initMemberMap() {
    var mymap = initMap();

    let members = await getMemberList();
    let markers = await Promise.all(members.map(async m => {
        let plz = m.xprofile.groups["1"].fields["22"] ? m.xprofile.groups["1"].fields["22"].value.raw : "";
        let name = m.xprofile.groups["1"].fields["1"].value.raw;
        if (plz != "") {
            let location = (await getLocationForPlz(plz));
            //console.log("plz", plz, location.name);
            if (location) {

                var icon = L.icon({
                    iconUrl: m.avatar_urls.thumb,
                    iconSize: [38, 38],
                    //iconAnchor: [22, 94],
                    //popupAnchor: [-3, -76],
                })

                var options = {title: name, ref: m.link}; 
                if (m.member_types.hasOwnProperty("mitglied")) options = {...options, icon}
                return {
                    plz,
                    latlong: [location.lat, location.lon],
                    options,
                    
                }
            }
        } else {
            //console.warn(`${name} has emtpy plz, dont fetch`);
        }
    }))

    markers = markers.filter(m => m != undefined);



    //console.log("location", await getLocationForPlz("45481")); 
    //console.log("members", members);
    //console.log(markers)
    
    //initMarkers(markers, mymap)
    initMarkerClusters( markers, mymap)

}

initMemberMap();
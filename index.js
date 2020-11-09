//const { plzs } = require("./plz");

const ACCESS_TOKEN = "pk.eyJ1IjoidGltb3ZvbGsiLCJhIjoiY2tmbWt1bGZwMDZndDJzcGwybng1d3I1ciJ9.PYYJgE9ZANvQB9QuHOfFCQ";
const BB_API_BASE_URL = "https://climactivity.de/wp-json";
const OPEN_STREETMAP_API = 'https://nominatim.openstreetmap.org/search?format=json&q=';

async function getMemberList() {

    // nur die Daten, die wir auch brauchen erfassen mit xprofile string 

    return await fetch(`${BB_API_BASE_URL}/buddyboss/v1/members?` + new URLSearchParams({ xprofile: "Ort" }), {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    })
        .then(response => response.json())

}

async function getLocationForPlz(plz) {

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

function initMap(markers) {
    document.querySelector('.spinner').innerHTML = ""
    var mymap = L.map('leaflet-map').setView([51.94, 10.26], 7);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: ACCESS_TOKEN
    }).addTo(mymap);
    markers.map(marker => {
        L.marker(marker.latlong, marker.options).addTo(mymap);
    })
}

async function initMemberMap() {
    let members = await getMemberList();
    let markers = await Promise.all(members.map(async m => {
        let plz = m.xprofile.groups["1"].fields["22"] ? m.xprofile.groups["1"].fields["22"].value.raw : "";
        let name = m.xprofile.groups["1"].fields["1"].value.raw;
        if (plz != "") {
            let location = (await getLocationForPlz(plz));
            console.log("plz", plz, location.name);
            if (location) {
                return {
                    latlong: [location.lat, location.lon],
                    options: {
                        title: name
                    }
                }
            }
        } else {
            //console.warn(`${name} has emtpy plz, dont fetch`);
        }
    }))
    markers = markers.filter(m => m != undefined);
    //console.log("location", await getLocationForPlz("45481")); 
    console.log("members", members);
    console.log(markers)
    initMap(markers);
}

initMemberMap();
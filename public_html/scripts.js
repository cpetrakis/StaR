/* 
 Created on : Dec 01, 2022, 1:11:54 PM
 Author     : Kostas Petrakis
 Contact: petrakis1@gmail.com
 */

/*------------------- Prevent default on enter --  ------------------------*/

$('#departures_form').keypress(function (e) {
    if (e.which === 13)
        e.preventDefault();
});

/*----------------- Leaflet markers declaration  -------------------------*/

const blueIcon = new L.Icon({
    iconUrl: 'assets/img/marker-icons/marker-icon-2x-blue.png',
    shadowUrl: 'assets/img/marker-icons/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
const greyIcon = new L.Icon({
    iconUrl: 'assets/img/marker-icons/marker-icon-2x-grey.png',
    shadowUrl: 'assets/img/marker-icons/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
const bluePin = new L.Icon({
    iconUrl: 'assets/img/marker-icons/bluedot.png',
    iconSize: [12, 12],
    iconAnchor: [0, 0],
    popupAnchor: [0, 0]
});
const redPin = new L.Icon({
    iconUrl: 'assets/img/marker-icons/red_dot.png',
    iconSize: [12, 12],
    iconAnchor: [0, 0],
    popupAnchor: [0, 0]
});

/*----------- Date picker initialization and icon declaration ------------*/

$('.datetimepicker').datetimepicker({
    icons: {
        time: "fa fa-clock-o",
        date: "fa fa-calendar",
        up: "fa fa-chevron-up",
        down: "fa fa-chevron-down",
        previous: 'fa fa-chevron-left',
        next: 'fa fa-chevron-right',
        today: 'fa fa-screenshot'
    }
});

/* Get current date and time, convert it to Locale string and puts into the date input */

let now = new Date();
now = now.toLocaleString("en-US", {year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit'});
$('#datetime').val(now.replace(',', ''));

/*---------------------- Declaration of map modal -------------------------*/
let modalMap;

/**
 * @summary Creates a dynamic auto-complete drop down from v5.db.transport API 
 * when user types at least 3 chars and store all location data on localstorage
 * for faster manipulation and less api calls
 */

$(function () {
    const autocompleteOptions = {
        minLength: 3,
        source: function (request, response) {
            $.ajax({
                type: "GET",
                url: "https://v5.db.transport.rest/locations?query=" + $('#departure_point').val() + "&fuzzy=false&results=100&stops=true&addresses=true&poi=true&linesOfStops=false&language=en",
                success: function (data) {
                    let selections = new Array();
                    let allLocations = new Object();
                    $.each(data, function () {
                        if (this.name && this.id) {
                            selections.push(this.name);
                            allLocations[this.name] = this;
                        }
                    });
                    localStorage.setItem("locations", JSON.stringify(allLocations));
                    response(selections);
                },
                error: function () {
                    $('#errorModal').modal('show');
                    setTimeout(function () {
                        $('#errorModal').modal('hide');
                    }, 2000);
                    console.log('ERROR');
                }
            });
        }
    };

    /**
     * @summary Creates a dynamic auto-complete drop down from v5.db.transport API 
     * when user types at least 3 chars and store all location data on localstorage
     * for faster manipulation and less api calls
     */
    function addInput() {
        let $input = $("<input>", {
            name: "search",
            "class": "searchInput",
            maxlength: "60"
        });
        $input.appendTo("form#departures_form").focus().autocomplete(autocompleteOptions);
    }
    
    $("input.searchInput").autocomplete(autocompleteOptions);
    $("input#addButton").click(addInput);
});

$(document).ready(function () {

    /*--------- Initialization of the Departure - Destination Locations ----------*/
    const map = L.map('map').setView([35.287468, 24.989863], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    /*--------------- Get departure, date/time and minutes range  -----------------*/
    $("#search").click(function () {
        let departure = $('#departure_point').val();
        $('#destination_name').html(departure);
        let datetime = $('#datetime').val();
        let locations = (JSON.parse(localStorage.getItem("locations")));
        let temptime = new Date(datetime);
        let utc = new Date(temptime.getTime() + temptime.getTimezoneOffset() * 60000);
        let range = $('#minutesRange').val();

        if (departure) {
            $('#loadingModal').modal('show');
            getDepartures(locations[departure].id, utc, range);
            clearPins();
            addDeparturetoMap(locations[departure]);
        } else {
            $('#departure_point').focus();
        }
    });

    /**
     * @summary Get provided services and convert them into html for the map popup
     * @param   {Object}    location    Departure location
     * @return {String} services services converted to html string
     */
    
    function getServices(location) {
        let services = "";
        $.each(location.products, function (key) {
            if (this == true) {
                services = services + key + "<br>";
            }
        });
        if (services) {
            services = "<br>Services Provided: <br>" + services;
        }
        return services;
    }

    /**
     * @summary Puts the departure location on map filling the popup with provided
     * services and using fly effect on the pin.
     * @param   {Object}    location    Departure location
     */

    function addDeparturetoMap(location) {
        let popHtml = "<b>" + location.name + "</b><br>" + getServices(location);
        L.marker([location.location.latitude, location.location.longitude], {icon: blueIcon}).setZIndexOffset(10000).addTo(map).bindPopup(popHtml);
        map.flyTo([location.location.latitude, location.location.longitude]);
    }
    
    /**
     * @summary Puts destination location on map filling the popup with provided
     * services.
     * @param   {Object}    location    Destination location
     */

    function addDestinationtoMap(location) {
        let popHtml = "<b>" + location.name + "</b><br>" + getServices(location);
        L.marker([location.location.latitude, location.location.longitude], {icon: greyIcon}).addTo(map).bindPopup(popHtml);
    }
    
    /**
     * Gets all the departures from the given location, date/time and minutes range
     * and calls the createDepartureTable to visualise the data.
     * @param   {String}    id    departure location id
     * @param   {Date}      time  given time converted in utc
     * @param   {String}    range MInutes ragne 
     */

    function getDepartures(id, time, range) {
        $.ajax({
            url: "https://v5.db.transport.rest/stops/" + id + "/departures?when=" + time + "&duration=" + range + "&linesOfStops=false&remarks=true&language=en",
            type: 'GET',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function (response) {
                createDepartureTable(response);
            },
            error: function () {
                $('#loadingModal').modal('hide');
                $('#errorModal').modal('show');
                setTimeout(function () {
                    $('#errorModal').modal('hide');
                }, 2000);
                console.log('ERROR');
            }
        });
    }
   
    /**
     * Converts departures data from getDeparures into a datatable and add Destination
     * pin on the map.
     * @param   {Object}    data    departure location id
     */

    function createDepartureTable(data) {

        // initialization of Datatables 
        let table = $("#departuresTable").DataTable();
        table.clear();

        if (data.length > 0) {
            $.each((data), function () {
                let delaycolor = "#00aa3f;";
                if (this.delay > 0) {
                    delaycolor = "#f43333;";
                }
                let planned = (new Date(this.plannedWhen).toLocaleString());
                let delay = '<span style="color:' + delaycolor + '">' + Math.floor(this.delay / 60) + ' min<span>';
                let actual = (new Date(this.when).toLocaleString());
                let destination = this.destination.name;
                let direction = this.direction;
                let linename = "";
                if (this.line.name) {
                    linename = this.line.name;
                } else {
                    linename = this.line.fahrtNr;
                }
                let line = linename + " (" + this.line.mode + ")";
                let operator = this.line.operator.name;
                let viewDetails = "<td><button onclick='getTripDetails(\"" + this.tripId + "\",\"" + this.line.name + "\");' class='btn btn-block btn-sm'>View Details</button></td>";

                table.row.add([
                    planned,
                    delay,
                    actual,
                    destination,
                    direction,
                    line,
                    operator,
                    viewDetails
                ]).draw();

                addDestinationtoMap(this.destination);
                $('#loadingModal').modal('hide');
            });
        } else {
            table.draw();
            $('#loadingModal').modal('hide');
            $('#noDataModal').modal('show');
            setTimeout(function () {
                $('#noDataModal').modal('hide');
            }, 2000);
        }
    }
    
    /**
     * @summary Clears all the pins on the map.
     */

    function clearPins() {
        $('#map').find(".leaflet-marker-icon").remove();
        $('#map').find(".leaflet-marker-shadow").remove();
    }
    
});


/**
 * @summary Gets further information of each trip and calls the createTripModal.
 * pin on the map.
 * @param   {String}    tripID      Trip Id
 * @param   {String}    lineName    line name 
 */

function getTripDetails(tripID, lineName) {
    $.ajax({
        url: "https://v5.db.transport.rest/trips/"+encodeURIComponent(tripID)+"?lineName="+encodeURIComponent(lineName)+"&stopovers=true&remarks=true&polyline=false&language=en",
        type: 'GET',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        success: function (response) {
            createTripModal(response);
        },
        error: function () {
            $('#errorModal').modal('show');
            setTimeout(function () {
                $('#errorModal').modal('hide');
            }, 2000);
            console.log('ERROR');
        }
    });
}

/**
 * @summary Creates the trip modal with extra infrormation about each trip by
 * calling each function for the modal components
 * @param   {Object}    trip     Trip infrormation
 */

function createTripModal(trip) {

    createTripModalHeader(trip);
    createDepartureInfo(trip);
    createArrivalInfo(trip);
    createRemarks(trip);
    createStopOvers(trip);

    $('#tripDetails').on('shown.bs.modal', function (e) {
        createModalMap(trip);
    });
    $('#tripDetails').modal('show');
}

/**
 * @summary Creates the header of trip modal 
 * @param   {Object}    trip     Trip infrormation
 */

function createTripModalHeader(trip) {
    let title = "From: <b>" + trip.origin.name + "</b> to: <b>" + trip.destination.name + "</b>";
    $("#tripDetailsTitle").html(title);
}

/**
 * @summary Creates the departure information block of trip modal
 * @param   {Object}    trip     Trip infrormation
 */

function createDepartureInfo(trip) {
    let htmlDeparture = "";
    let departure_time = (new Date(trip.departure).toLocaleString());
    let departure_delay = Math.floor(trip.departureDelay / 60) + " min";
    delayColor = "#00aa3f;";
    if (trip.departureDelay > 0) {
        delayColor = "#f43333";
    }

    htmlDeparture = htmlDeparture + '<tr><td><b> Departure : </b>' + departure_time + '<br></tr></td>';
    htmlDeparture = htmlDeparture + '<tr><td><b> Departure Delay: </b><span style="color:' + delayColor + ' ">' + departure_delay + '</span><br></tr></td>';
    if (trip.departurePlatform) {
        htmlDeparture = htmlDeparture + '<tr><td><b> Departure Platform : </b>' + trip.departurePlatform + '<br></tr></td>';
    }
    htmlDeparture = htmlDeparture + '<tr><td><b> Departure Direction : </b>' + trip.direction + '<br></tr></td>';
    htmlDeparture = htmlDeparture + '<tr><td><b> Line Info : </b>' + trip.line.name + ' (' + trip.line.mode + ')<br></tr></td>';
    if (trip.line.operator) {
        htmlDeparture = htmlDeparture + '<tr><td><b> Operator : </b>' + trip.line.operator.name + '<br></tr></td>';
    }

    $('#departureInfo').html(htmlDeparture);
}

/**
 * @summary Creates the arrival information block of trip modal
 * @param   {Object}    trip     Trip infrormation
 */

function createArrivalInfo(trip) {
    let html = "";
    let arrival_time = (new Date(trip.arrival).toLocaleString());
    let arrival_delay = Math.floor(trip.arrivalDelay / 60) + " min";
    let delayColor = "#00aa3f;";
    if (trip.arrivalDelay > 0) {
        delayColor = "#f43333";
    }

    html = html + '<tr><td><b> Arrival : </b>' + arrival_time + '<br></tr></td>';
    html = html + '<tr><td><b> Arrival Delay: </b><span style="color:' + delayColor + ' ">' + arrival_delay + '</span><br></tr></td>';
    if (trip.arrivalPlatform) {
        html = html + '<tr><td><b> Arrival Platform : </b>' + trip.arrivalPlatform + '<br></tr></td>';
    }
    $('#arrivalInfo').html(html);
}

/**
 * @summary Creates the remarks information block of trip modal
 * @param   {Object}    trip     Trip infrormation
 */

function createRemarks(trip) {
    if (trip.remarks) {
        let remarks_html = "";
        $.each(trip.remarks, function (cnt) {

            let summary = this.code;
            if (this.summary) {
                summary = this.summary;
            }
            remarks_html = remarks_html + '<tr><td> ' + this.type + ' : <b>' + summary + '</b> (' + this.text + ' )<br></tr></td>';
        });
        $('#remarks').html(remarks_html);
    } else {
        $('#headingRemarks').parent().parent().hide();
    }
}

/**
 * @summary Creates the stopovers information block of trip modal
 * @param   {Object}    trip     Trip infrormation
 */

function createStopOvers(trip) {

    let stopovers = "";
    $.each(trip.stopovers, function (cnt) {
        stopovers = stopovers +
                `<tr class="stopOverRow">
            <td>
                <div class="form-check">
                    <label class="form-check-label">
                        <input id="stopover_` + this.stop.name.replace(/[`~!@#$%^&*()_ |+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') + `" class="form-check-input" type="checkbox" value="">
                        <span class="form-check-sign">
                            <span class="check"></span>
                        </span>
                    </label>
                </div>
            </td>
            <td>` + this.stop.name + `</td>
            <td class="td-actions text-right">
                <button  type="button" rel="tooltip" title="Remove" class="btn btn-danger btn-link btn-sm " onclick='hideStopOver(this)'>
                    <i class="material-icons">close</i>
                </button>
            </td>
        </tr>`;
    });

    $('#stopovers').html(stopovers);

    $.each(trip.stopovers, function () {
        let now = new Date();
        let selectedDate = new Date(this.arrival);
        if (selectedDate < now) {
            $('#stopover_' + this.stop.name.replace(/[`~!@#$%^&*()_ |+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')).prop('checked', true);
        }
    });
}

/**
 * @summary Show stopovers on stopove rinformation block
 */

function showStopOvers() {
    $('.stopOverRow').show();
}

/**
 * @summary Hides stopovers from stopover information block
 * @param   {Object}    stopover     Stopover html element to hide
 */

function hideStopOver(stopover) {
    $(stopover).parent().parent().hide();
}

/**
 * @summary Creates the map in modal trip showing destination, origin, current 
 * location (if exists) and all stopovers with their arrival date/time and name
 * @param   {Object}    trip     Trip information
 */

function createModalMap(trip) {

    $('#modalMap').remove();
    $('#tripDetails').find('.modal-body').append('<div id="modalMap"></div>');
    $("#modalMap").append('<div style="width:200px; height:400px;"></div>');
    setTimeout(function () {

        if (modalMap != undefined) {
            modalMap.remove();
        }

        modalMap = L.map('modalMap').setView([35.287468, 24.989863], 10);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(modalMap);

        L.marker([trip.origin.location.latitude, trip.origin.location.longitude], {icon: blueIcon}).addTo(modalMap).bindPopup('Origin:' + trip.origin.name);
        L.marker([trip.destination.location.latitude, trip.destination.location.longitude], {icon: greyIcon}).addTo(modalMap).bindPopup('Destination: ' + trip.destination.name);

        $.each(trip.stopovers, function (cnt) {

            let stopover = this;
            let popUphtml = "Name: <b>" + this.stop.name + '</b><br>';
            let arrivalDateTime = (new Date(this.arrival).toLocaleString());
            if (this.arrival) {
                popUphtml = popUphtml + "Arrival: <b>" + arrivalDateTime + '</b><br>';
            }

            let remmarksHtml = "";
            $.each(stopover.remarks, function (cnt) {
                remmarksHtml = remmarksHtml + this.type + " : <b>" + this.text + "</b><br>";
            });

            popUphtml = popUphtml + remmarksHtml + '<br>';
            L.marker([this.stop.location.latitude, this.stop.location.longitude], {icon: redPin}).addTo(modalMap).bindPopup(popUphtml);

        });
        if (trip.currentLocation) {
            if (trip.currentLocation.latitude && trip.currentLocation.longitude) {
                L.marker([trip.currentLocation.latitude, trip.currentLocation.longitude], {icon: bluePin}).setZIndexOffset(10000).addTo(modalMap).bindPopup('Current Location');
                modalMap.flyTo([trip.currentLocation.latitude, trip.currentLocation.longitude]);
            }
        } else {
            modalMap.flyTo([trip.destination.location.latitude, trip.destination.location.longitude]);
        }
    }, 10);
}

# Smart Trip plAnneR

### 1. Description ###

Smart Trip Planner is a standalone web application with a key role to present to the user all journey's details which start from a given departure location (city or station name), date and time and a specific minutes range.

![Alt text](assets/img/readme/1.png? "Home")

The main screen contains three inputs where user can fill the basic parameters to search.
In the first input user must type at least 3 characters and the system dynammically generates a dropdown list (querying the given api) with all possible locations that should match to the given input to select from. 
The second input provides a datetime picker with a familiar calendar in which the user can pick a desired date and time. 
The third ipnut accepts only digits which are the minutes range for the departure.

![Alt text](assets/img/readme/2.png?raw=true "Location form")

![Alt text](assets/img/readme/3.png?raw=true "Date picker")

When all neccesary information is filled and user hits the search button, application generates dynamically a table whith all departures from the given location and starting from the given date/time and range.

![Alt text](assets/img/readme/4.png?raw=true "Departures table")

A map is also being generated showing the departure location (blue marker) and all the possible destinations (grey markers).
Clicking on each marker user can access the services provided in every station.

![Alt text](assets/img/readme/5.png?raw=true "Departures map")

On the departures table there is a button (view details) which generates a modal showing all the available information about the departure, arrival and remarks information. It also provides all the stopovers (all the passed stops are checked) giving the user the ability to manage the stops through the UI.

![Alt text](assets/img/readme/6.png?raw=true "Trip information 1/2")

![Alt text](assets/img/readme/7.png?raw=true "Trip information 2/2")

Last but not least the application also provides a map whith information about the route of the journey. (blue marker = Origin location, grey marker= destination location, red dot = stopovers, blue dot = current location).

![Alt text](assets/img/readme/8.png?raw=true "Trip route on map")
 
Finally, the tool is implemented in such a way that it is easily scalable.

**Live Demo [here.](http://petrakis.info/Star/)**

#### Built With

* [jQuery](https://jquery.com/)
* [Bootstrap](https://getbootstrap.com/)
* [Material Dashboard](https://github.com/creativetimofficial/material-dashboard)
* [Leaflet](https://leafletjs.com/)

#### Prerequisites

* Java
* Apache Tomcat or any other webapplication server (Jetty,Glassfish etc.)

### 2. Installation and deployment ###

Three simple steps: Clone - Deploy - Run.

1. Copy the project folder into the desired location. 

2. Deploy (drop the folder into your desired web appliction server (eg webapps for Apache Tomcat)).

3. Run 

This project is written mainly in JavaScript so it can be deployed directly on a web server (eg. Tomcat v7 or greater). 
After deployment you will be able to access the application in address: [URL]:[PORT]/Star

### 3. Contact ### 

Kostas Petrakis < petrakis1@gmail.com >

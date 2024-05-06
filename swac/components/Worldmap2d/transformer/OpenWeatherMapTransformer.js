export default class OpenWeatherMapTransformer {

    toGeoJSON(data) {
        // create an empty GeoJSON object
        var geojson = {
            type: "FeatureCollection",
            features: []
        };
        // loop through the list of cities
        for (var i = 0; i < data.list.length; i++) {
            // get the city object
            var city = data.list[i];
            // create a GeoJSON feature for the city
            var feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [city.coord.Lon, city.coord.Lat]
                },
                properties: {
                    name: city.name,
                    weather_name: city.weather[0].main,
                    weather_description: city.weather[0].description,
                    weather_icon: city.weather[0].icon,
                    temp_feels_like: city.main.feels_like,
                    temp: city.main.temp,
                    temp_max: city.main.temp_max,
                    temp_min: city.main.temp_min,
                    humidity: city.main.humidity,
                    pressure: city.main.pressure,
                    visibility: city.visibility,
                    wind_speed: city.wind.speed,
                    wind_deg: city.wind.deg,
                    wind_gust: city.wind.gust,
                    clouds: city.clouds.today
                }
            };
            if(city.rain) {
                feature.properties.rain_1h = city.rain['1h'];
                feature.properties.rain_3h = city.rain['3h'];
            }
            if(city.snow) {
                feature.properties.snow_1h = city.snow['1h'];
                feature.properties.snow_3h = city.snow['3h'];
            }
            
            // add the feature to the GeoJSON object
            geojson.features.push(feature);
        }
        // return the GeoJSON object
        return geojson;
    }
}
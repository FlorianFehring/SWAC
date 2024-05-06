/* 
 * This class contains calculation methods for cesium
 */

class WorldmapCalculations {

    /**
     * Calculates ECEF coordinates from WGS84 coordinates. Uses a reimplementation
     * of cesiums internal coordinate calculation.
     * 
     * @param {Double} lon Longitude of the coordinate to transform
     * @param {Double} lat Latitude of the coordinate to transform
     * @param {Double} height Height above ground of the coordinate to transform
     * @returns {Cartesian3} Coordinate in ECEF Cesium
     */
    WGS842ecef(lon = 8.592865526642761, lat = 51.94899226317016, height = 169.17) {

        let lonRad = Cesium.Math.toRadians(lon);
        let latRad = Cesium.Math.toRadians(lat);
        console.log("lonRad: " + lonRad);
        console.log("latRad: " + latRad);
        console.log("radiiSquared");
        var wgs84RadiiSquared = new Cesium.Cartesian3(6378137.0 * 6378137.0, 6378137.0 * 6378137.0, 6356752.3142451793 * 6356752.3142451793);
        console.log(wgs84RadiiSquared);
        let cosLatitude = Math.cos(latRad);
        console.log("cosLatitude: " + cosLatitude);

        let scratchN = new Cesium.Cartesian3();
        scratchN.x = cosLatitude * Math.cos(lonRad);
        scratchN.y = cosLatitude * Math.sin(lonRad);
        scratchN.z = Math.sin(latRad);
        scratchN = Cesium.Cartesian3.normalize(scratchN, scratchN);

        console.log("scratchN");
        console.log(scratchN);

        console.log("scratchK");
        let scratchK = new Cesium.Cartesian3();
        Cesium.Cartesian3.multiplyComponents(wgs84RadiiSquared, scratchN, scratchK);
        console.log(scratchK);

        var gamma = Math.sqrt(Cesium.Cartesian3.dot(scratchN, scratchK));
        console.log("gamma:");
        console.log(gamma);

        console.log("scratchK devideByGamma");
        scratchK = Cesium.Cartesian3.divideByScalar(scratchK, gamma, scratchK);
        console.log(scratchK);
        console.log("scratchN multiplyByScalar");
        scratchN = Cesium.Cartesian3.multiplyByScalar(scratchN, height, scratchN);
        console.log(scratchN);


        let result = new Cesium.Cartesian3();
        Cesium.Cartesian3.add(scratchK, scratchN, result);
        console.log("result:");
        console.log(result);

        console.log("result from self calculation: " + result);
        console.log("result from fromDegrees()");
        let fromDegreesPos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
        console.log(fromDegreesPos);
        
        return fromDegreesPos;
    }
}

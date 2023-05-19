// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4Zjk5N2RlYS0zMGY2LTQxNWQtYjAwMy1iYWUyODI4ODY5YTUiLCJpZCI6MTE3OTUzLCJpYXQiOjE2NzA3Mzk4MTl9.k3I9be0G6cm7S9-U3lYsvSaUZ6mKVf0Capzojy3RZAU";
//Cesium.GoogleMaps.defaultApiKey = "AIzaSyA1au3L6n6ZZvFqojyNMfB27DiGHLAX7h8"; // Turn on/off

async function main() {

    // Create viewer
    const viewer = new Cesium.Viewer("cesiumContainer", {
      // timeline: false,
      // animation: false,
      // infoBox: false,
      geocoder: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
      searchButton: false,
      homeButton: false,
      selectionIndicator: false,
      sceneModePicker: false,
      baseLayerPicker: false,
    });

    // Preview OSM tileset - Turn on/off
    const osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(osmBuildingsTileset);

    // Cesium globe true or false
    viewer.scene.globe.show = true;

    // Add lighting mesh
    try {
      const lightingMesh = await Cesium.Cesium3DTileset.fromIonAssetId(1700850);
      viewer.scene.primitives.add(lightingMesh);

    } catch (error) {
      console.log(error);
    }

    // Add Photorealistic 3D Tiles - Turn on/off
    // try {
    //   const tileset = await Cesium.createGooglePhotorealistic3DTileset();
    //   viewer.scene.primitives.add(tileset);
    
    //   } catch (error) {
    //   console.log(`Error loading Photorealistic 3D Tiles tileset.\n${error}`);
    // }

    // Import data source file
    const dataSourcePromise = Cesium.CzmlDataSource.load("data.czml");
    viewer.dataSources.add(dataSourcePromise);
    
    // Sort data to get position values of each entity
    dataSourcePromise.then((dataSource) => {
      const entities = dataSource.entities.values;
      const numEntities = entities.length;

      let currentIndex = 0;

      // Function to handle the right button click
      function onNextButtonClick() {
        
        if (currentIndex >= numEntities) {
          currentIndex = 0;
        }
        const entity = entities[currentIndex];
        const positionValue = entity.position.getValue();
        viewer.selectedEntity = entity;

        camFlyTo(positionValue);

        currentIndex++;
      }

      // Function to handle the left button click
      function onPrevButtonClick() {

        if (currentIndex < 0) {
          currentIndex = numEntities - 1;
        }

        const entity = entities[currentIndex];
        const positionValue = entity.position.getValue();
        viewer.selectedEntity = entity;

        camFlyTo(positionValue);

        currentIndex--;
      }
      
      const rightButton = document.getElementById("RightBut");
      rightButton.addEventListener("click", onNextButtonClick);
    
      const leftButton = document.getElementById("LeftBut");
      leftButton.addEventListener("click", onPrevButtonClick);

    });



  // Target location
  const targetSphere = viewer.entities.add({
    name: "Target sphere",
    position: Cesium.Cartesian3.fromDegrees(174.766387, -36.845995, 80),
    ellipsoid: {
      radii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
      material: Cesium.Color.GREEN.withAlpha(0.0)
    },
  });

  // Fly camera to entity position and look at target location
  function camFlyTo(positionValue) {

    var viewPosition = positionValue;

    var newPosition = Cesium.Cartesian3.add(viewPosition, new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3());
    var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(targetSphere.position.getValue(Cesium.JulianDate.now()), newPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    var right = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(direction, viewer.camera.position, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    var up = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()), new Cesium.Cartesian3());

    viewer.camera.flyTo({
      destination: newPosition,
      orientation: {
        direction: direction,
        up: up
      },
      duration: 3
    });
  }

  // Event listeners for the buttons
  const dayButton = document.getElementById('DaylightBut');
  dayButton.addEventListener('click', function() {
    dayTimeLighting();
  });

  const nightButton = document.getElementById('NightBut');
  nightButton.addEventListener('click', function() {
    nightTimeLighting();
  });

  const homeButton = document.getElementById('HomeBut');
  homeButton.addEventListener('click', function() {
    resetCameraPositionToHome();
  });

  // Create button Augmented
	const augmentedButton = document.getElementById('AugmentedBut');
	
	// Augmented button EventListener
	augmentedButton.addEventListener('click', function() {
		if (QRwindow.classList.contains('close')) {
		  QRwindow.classList.remove('close');
		  QRwindow.classList.add('open');
		} else if (QRwindow.classList.contains('open')) {
		  QRwindow.classList.remove('open');
		  QRwindow.classList.add('close');
		} else if (!QRwindow.classList.contains('open')) {
			QRwindow.classList.add('open');
		}
	  });

  // Camera home position
  function resetCameraPositionToHome(){
    viewer.scene.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        174.7615727937406,
        -36.84333832264615,
        400
      ),
      orientation: {
        heading: 2.165775125478591,
        pitch: -0.5620692967690193,
        roll: 6.283180485546438
      }
    });
    currentIndex = 0;
  };

  // Daytime lighting
  function dayTimeLighting() {
    // Set scene defaults
    scene.light = sunLight;
    scene.globe.dynamicAtmosphereLighting = true;
    scene.globe.dynamicAtmosphereLightingFromSun = false;
    setTime("2020-01-09T23:00:39.018261982600961346Z");
  }

  // Night time lighting
  function nightTimeLighting() {
    reset();
    scene.light = moonLight;
    scene.globe.dynamicAtmosphereLightingFromSun = true;
    setTime("2020-01-10T3:00:41.17946898164518643Z");
  }

  // Enable lighting
  const scene = viewer.scene;
  scene.globe.enableLighting = true;
  const scratchIcrfToFixed = new Cesium.Matrix3();
  const scratchMoonPosition = new Cesium.Cartesian3();
  const scratchMoonDirection = new Cesium.Cartesian3();
  const sunLight = new Cesium.SunLight();
  const moonLight = new Cesium.DirectionalLight({
    direction: getMoonDirection(), // Updated every frame
    color: new Cesium.Color(0.9, 0.925, 1.0),
    intensity: 0.25,
  });

  scene.light = sunLight;
  scene.globe.dynamicAtmosphereLightingFromSun = true;
  setTime("2020-01-10T03:00:41.17946898164518643Z");

  function getMoonDirection(result) {
    result = Cesium.defined(result) ? result : new Cesium.Cartesian3();
    const icrfToFixed = scratchIcrfToFixed;
    const date = viewer.clock.currentTime;
    if (
      !Cesium.defined(
        Cesium.Transforms.computeIcrfToFixedMatrix(date, icrfToFixed)
      )
    ) {
      Cesium.Transforms.computeTemeToPseudoFixedMatrix(date, icrfToFixed);
    }
    const moonPosition = Cesium.Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(
      date,
      scratchMoonPosition
    );
    Cesium.Matrix3.multiplyByVector(
      icrfToFixed,
      moonPosition,
      moonPosition
    );
    const moonDirection = Cesium.Cartesian3.normalize(
      moonPosition,
      scratchMoonDirection
    );
    return Cesium.Cartesian3.negate(moonDirection, result);
  }

  function setTime(iso8601) {
    const currentTime = Cesium.JulianDate.fromIso8601(iso8601);
    const endTime = Cesium.JulianDate.addDays(
      currentTime,
      2,
      new Cesium.JulianDate()
    );
    viewer.clock.currentTime = currentTime;
    viewer.timeline.zoomTo(currentTime, endTime);
  }

  function reset() {
    // Set scene defaults
    scene.light = sunLight;
    scene.globe.dynamicAtmosphereLighting = true;
    scene.globe.dynamicAtmosphereLightingFromSun = false;
    setTime("2020-01-09T23:00:39.018261982600961346Z");
  }

  scene.preRender.addEventListener(function (scene, time) {
    if (scene.light === moonLight) {
      scene.light.direction = getMoonDirection(scene.light.direction);
    }
  });

  // Initial scene camera position
  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      174.7615727937406,
      -36.84333832264615,
      400
    ),
    orientation: {
      heading: 2.165775125478591,
      pitch: -0.5620692967690193,
      roll: 6.283180485546438
    }
  });

  // Create a custom QRwindow
	const container = document.getElementById("cesiumContainer");
	const QRwindow = document.createElement("div");
	const topQRwindowDiv = document.createElement("div");
	const botQRwindowDiv = document.createElement("div");
	const midQRwindowDiv = document.createElement("div");

	QRwindow.classList.add("custom-QRwindow");
	topQRwindowDiv.classList.add("top-div-QRwindow");
	botQRwindowDiv.classList.add("bot-div-QRwindow");
	midQRwindowDiv.classList.add("mid-div-QRwindow");

	topQRwindowDiv.innerHTML = "<img src='img/ID-QR_01.png' alt='QR code' width= '250' height='250'>";
	botQRwindowDiv.innerHTML = "<p>Use your mobile device to</br>scan the QR code.</br><hr>If you have an iPhone you will</br>need to download XRViewer</br>first from the App store to scan the QR code.</p>";
	midQRwindowDiv.innerHTML = "<img src='img/QR_WebXR.png' alt='QR code' width='120' height='120'><p>XRViewer</p>";

	QRwindow.appendChild(topQRwindowDiv);
	QRwindow.appendChild(botQRwindowDiv);
	QRwindow.appendChild(midQRwindowDiv);

	container.appendChild(QRwindow);

}

main();

/*

  function flyto(positionValue) {

    var viewPosition = positionValue;
    var newPosition = Cesium.Cartesian3.add(viewPosition, new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3());
    var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(targetSphere.position.getValue(Cesium.JulianDate.now()), newPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    var right = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(direction, viewer.camera.position, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    var up = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()), new Cesium.Cartesian3());

    viewer.camera.flyTo({
      destination: newPosition,
      orientation: {
        direction: direction,
        up: up // Use the newly calculated up vector
      },
      duration: 3
    });
  }



// Console log out cameras coordinates as well as HeadingPitchRoll in radians

  viewer.scene.postUpdate.addEventListener(function() {
  var camera = viewer.scene.camera;
  var headingPitchRoll = new Cesium.HeadingPitchRoll(camera.heading, camera.pitch, camera.roll);

  var ellipsoid = viewer.scene.globe.ellipsoid;

  var cartesian = camera.positionWC;
  var cartographic = ellipsoid.cartesianToCartographic(cartesian);
  
  var longitude = Cesium.Math.toDegrees(cartographic.longitude);
  var latitude = Cesium.Math.toDegrees(cartographic.latitude);

  console.log("Longitude: " + longitude + ", Latitude: " + latitude);
  console.log(headingPitchRoll);
});

    // Add lighting mesh
    try {
      const resource = await Cesium.IonResource.fromAssetId(1700850);

      //const position = Cesium.Cartesian3.fromDegrees(174.766154, -36.846165, 50);
      //const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(20), 0, 0);

      const entity = viewer.entities.add({
        //position: position,
        //orientation: Cesium.Transforms.headingPitchRollQuaternion(position, hpr),
        //scale: new Cesium.Cartesian3(5, 5, 5), 
        model: {
          uri: resource,
        },
      });
    } catch (error) {
      console.log(error);
    }


  */




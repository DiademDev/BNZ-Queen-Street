import * as THREE from 'https://cdn.skypack.dev/three@0.134.0/build/three.module.js';
import { ARButton } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader} from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/loaders/DRACOLoader.js';


document.addEventListener('DOMContentLoaded', () => {
  const initialize = async() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    const reticleGeometry = new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX(- Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial(); 
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    const arButton = ARButton.createButton(renderer, {requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: {root: document.body}});
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();

    var modelGrp = [];

    controller.addEventListener('select', () => {

      if(modelGrp.length === 0) {

      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);

      loader.load( './model/model_augmented.glb', function ( glb ) {

        const model = glb.scene;
        model.position.setFromMatrixPosition(reticle.matrix);
        model.scale.set(0.2, 0.2, 0.2);
        //model.rotation.y = -Math.PI / 2;

        // Rotate model to face camera
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);
        const modelToCameraDirection = new THREE.Vector3();
        modelToCameraDirection.subVectors(cameraPosition, model.position).normalize();
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 0), modelToCameraDirection);

        // const additionalRotation = new THREE.Euler(0, THREE.MathUtils.degToRad(120), 0, 'XYZ');
        // targetQuaternion.multiply(targetQuaternion.setFromEuler(additionalRotation));

        model.setRotationFromQuaternion(targetQuaternion);

        // Create lights
        const pointLight = new THREE.PointLight( 0xffffff, 1, 50 );
        pointLight.position.set( 0, 15, 5 );

        const ambientLight1 = new THREE.AmbientLight(0x7690ca, 0.2);
        const ambientLight2 = new THREE.AmbientLight(0x7690ca, 0.3);

        const spotLight = new THREE.SpotLight(0xfff7d8, 5);
        spotLight.position.set(50, 100, 10);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.05;
        spotLight.decay = 2;
        spotLight.distance = 200;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.camera.near = 0.5;
        spotLight.shadow.camera.far = 500;

        /* const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        hemiLight.position.set( 0, 20, 0 );
        scene.add( hemiLight ); */

        scene.add( pointLight, ambientLight1, ambientLight2, spotLight);
        scene.add( model );

        modelGrp.push( model );
    
      },undefined, function ( error ) {
        console.error( error );
        } 
      );
    }
    });

    renderer.xr.addEventListener("sessionstart", async (e) => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({space: viewerReferenceSpace});

      renderer.setAnimationLoop((timestamp, frame) => {
	if (!frame) return;

	const hitTestResults = frame.getHitTestResults(hitTestSource);

	if (hitTestResults.length) {
	  const hit = hitTestResults[0];
	  const referenceSpace = renderer.xr.getReferenceSpace(); // ARButton requested 'local' reference space
	  const hitPose = hit.getPose(referenceSpace);

	  reticle.visible = true;
	  reticle.matrix.fromArray(hitPose.transform.matrix);
	} else {
	  reticle.visible = false;
	}

	renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      console.log("session end");
    });

  }

  initialize();
});
const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const poseNameInput = document.getElementById('poseName');
const addPoseButton = document.getElementById('addPoseButton');
const saveButton = document.getElementById('saveButton');
const fileInput = document.getElementById("file-input");

const poseLibraryFileName = 'pose-library.json';
const distanceThreshold = 0.2;
let poseLibrary = new Map();
let currentFeatures = null;
let currentLabel = 'unknown';
let history = [];

(async function main() {
  // MediaPipe pose estimation setup
  const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults(onPoseResults);

  // MediaPipe Camera setup
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });

  camera.start();

  addPoseButton.addEventListener('click', addPose); // add pose button
  fileInput.addEventListener('change', loadPoseLibrary); // load pose library input
  saveButton.addEventListener('click', savePoseLibrary); // save pose library button
})();

function onRecognizedPose(label) {
  if (label !== 'unknown') {
    console.log(label);
  }
}

/**************************************************************
 * draw and recognize poses
 */
function onPoseResults(results) {
  let label = 'unknown';

  // resize canvas to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);

  // draw camera image (swapped)
  context.scale(-1, 1);
  context.translate(-canvas.width, 0);
  context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    // draw pose
    drawConnectors(context, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#fff',
      lineWidth: 4
    });

    drawLandmarks(context, results.poseLandmarks, {
      color: '#fff',
      lineWidth: 2,
      radius: 4
    });

    // estimate features
    currentFeatures = getPoseFeatures(results.poseLandmarks);

    // classify/label pose
    const rawLabel = classifyWithThreshold(currentFeatures);
    label = smoothLabel(rawLabel);
  } else {
    currentFeatures = null;
    label = 'unknown';
  }

  // draw label
  context.scale(-1, 1);
  context.translate(-canvas.width, 0);
  drawLabel(context, label);

  if (label !== currentLabel) {
    onRecognizedPose(label);
    currentLabel = label;
  }

  context.restore();
}

// calculate features
function getPoseFeatures(landmarks) {
  const angle = (a, b, c) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };

    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);

    return Math.acos(dot / (magAB * magCB + 1e-6));
  };

  return [
    angle(landmarks[11], landmarks[13], landmarks[15]), // left elbow
    angle(landmarks[12], landmarks[14], landmarks[16]), // right elbow

    angle(landmarks[13], landmarks[11], landmarks[23]), // left shoulder
    angle(landmarks[14], landmarks[12], landmarks[24]), // right shoulder

    angle(landmarks[23], landmarks[25], landmarks[27]), // left knee
    angle(landmarks[24], landmarks[26], landmarks[28]), // right knee

    angle(landmarks[11], landmarks[23], landmarks[25]), // left hip
    angle(landmarks[12], landmarks[24], landmarks[26])  // right hip
  ];
}

/// classify/label pose using kNN
function classifyWithThreshold(features, k = 3) {
  const distances = [];

  for (const [label, pose] of poseLibrary) {
    for (const sample of pose) {
      const dist = featureDistance(features, sample);
      distances.push({ label, dist });
    }
  }

  if (distances.length > 0) {
    distances.sort((a, b) => a.dist - b.dist);

    const topK = distances.slice(0, k);
    const avgDist = topK.reduce((sum, d) => sum + d.dist, 0) / topK.length;

    if (avgDist < distanceThreshold) {
      const votes = {};

      for (let { label, dist } of topK) {
        votes[label] = (votes[label] || 0) + 1;
      }

      return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  return 'unknown';
}

const weights = [1, 1, 0.8, 0.8, 1, 1, 0.6, 0.6];

// calculate distance beteen two poses based on weighted features
function featureDistance(f1, f2) {
  let sum = 0;

  for (let i = 0; i < f1.length; i++) {
    sum += weights[i] * Math.abs(f1[i] - f2[i]);
  }

  return sum / f1.length;
}

// smooth output lables
function smoothLabel(label) {
  history.push(label);
  if (history.length > 5) history.shift();

  const counts = {};

  for (let label of history) {
    counts[label] = (counts[label] || 0) + 1;
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**************************************************************
 * pose libray
 */
function addPose() {
  const name = poseNameInput.value.trim();

  if (name && currentFeatures) {
    let pose = poseLibrary.get(name);

    if (!pose) {
      pose = [];
      poseLibrary.set(name, pose);
    }

    pose.push([...currentFeatures]);
    console.log(`Added sample to '${name}'. Count: ${pose.length}`);
  }
};

function loadPoseLibrary() {
  if (fileInput.files.length === 1) {
    const file = fileInput.files.item(0);
    const fileReader = new FileReader();

    fileReader.addEventListener('load', (e) => {
      poseLibrary = new Map(Object.entries(JSON.parse(e.target.result)));
      console.log(`Loaded pose library from '${file.name}'`);
    });

    fileReader.readAsText(file);
  }
}

function savePoseLibrary() {
  const data = JSON.stringify(Object.fromEntries(poseLibrary));
  const blob = new Blob([data], { type: 'application/json' });
  const anchor = document.createElement('a');

  anchor.href = URL.createObjectURL(blob);
  anchor.download = poseLibraryFileName;
  anchor.click();

  console.log(`Saved pose library to '${poseLibraryFileName}'`);

  URL.revokeObjectURL(anchor.href);
}

function drawLabel(context, label) {
  context.fillStyle = 'white';
  context.font = '96px sans-serif';
  context.fillText(label, 10, 80);
}
// const { createElement } = require("react");

const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const poseNameInput = document.getElementById('poseName');
const addPoseButton = document.getElementById('addPoseButton');
const saveButton = document.getElementById('saveButton');
const fileInput = document.getElementById("file-input");


const poseLibraryFileName = 'pose-library.json';
const distanceThreshold = 0.2;
let Audio = document.getElementById("RickRoll");
let Sakura = document.getElementById("cacs");
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

  // addPoseButton.addEventListener('click', addPose); // add pose button
  startButton.addEventListener('click', GameStart);
  // pauseButton.addEventListener('click', GamePause);
  fileInput.addEventListener('change', loadPoseLibrary); // load pose library input
  // saveButton.addEventListener('click', savePoseLibrary); // save pose library button
})();

const bpm = 113;


function GameStart() {
  console.log("Hello");
  Audio.currentTime = 0;
  Audio.play()
  GameLoop()
}

function GamePause() {
  Audio.pause();
}

function GameLoop() {
  const time = Audio.currentTime
  let beat = time / 0.530973451 * 2.0 //Achtel 
  checkPoseTiming(beat);
  trySpawn(beat);
  update(beat);
  update2(beat);
  rush(beat);
  requestAnimationFrame(GameLoop);

}


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

const img1 = document.getElementById("pistoleL");
const img2 = document.getElementById("pistoleR");
const button = document.getElementById("startButton");
const stops = document.getElementById("pauseButton");
//const speed = 2;





const cues = [
  { beat: 21.5, pose: "pose-1", duration: 1, double: false }, //
  { beat: 37.0, pose: "pose-2", duration: 1, double: false },
  { beat: 53.0, pose: "pose-1", duration: 1, double: true },
  { beat: 93.0, pose: "pose-2", duration: 1, double: false },
  { beat: 95.5, pose: "pose-1", duration: 1, double: false },
  { beat: 107.5, pose: "pose-2", duration: 1, double: false },
  { beat: 112.0, pose: "pose-1", duration: 1, double: false },
  { beat: 133.0, pose: "pose-2", duration: 4, double: true },
  { beat: 164.5, pose: "pose-1", duration: 2, double: false }, //give
  { beat: 167.5, pose: "pose-2", duration: 2, double: false }, // up
  { beat: 172.0, pose: "pose-1", duration: 2, double: false },
  { beat: 175.0, pose: "pose-2", duration: 2, double: false },
  { beat: 175.0, pose: "pose-2", duration: 2, double: false }
];


let currentCueIndex = 0;
let currentCueIndex2 = 0;
let holdStartTime = null
const tolerance = 2
const preTolerance = -3
let isHolding = false;
let tooSoon = false;
let points = 0
let fbb = document.getElementById("fb");
let fb = "test";
let hasSpawned = false;
const delay = 2000;
document.getElementById("points").innerText = points;


function removeFb() {
  fb = "";
}



function checkPoseTiming(beat) {

  fbb.innerText = fb;
  const cue2 = cues[currentCueIndex2];
  if (!cue2) return;

  const inWindow = Math.abs(beat - cue2.beat) <= tolerance; // 

  const preWindow = beat >= cue2.beat + preTolerance && beat < cue2.beat;

  //  inWindow && beat >= cue.beat && currentLabel === cue.pose && !isHolding
  //beat - cue.beat >= preTolerance && beat - cue.beat < tolerance

  if (preWindow && currentLabel == cue2.pose) {
    console.log("WAS MACHST DU???????????????????");

    if (beat - cue2.beat >= preTolerance && beat - cue2.beat < tolerance)
      console.log("ZU FRÜH BROOOOOOOO");
    document.getElementById('fb').style.color = 'red';
    document.getElementById('fb').style.fontSize = "200px";
    fb = "EARLY";
    setTimeout(removeFb, delay);
    tooSoon = true;
  }

  // if (!preWindow && cue.pose == 'unknown') {
  // tooSoon = false;
  // }

  if (beat >= cue2.beat) {
    console.log("AAAAAVVE MARIA", cue2.pose);
  }

  // 🔴 MISS CHECK (GANZ AM ANFANG)
  if (beat > cue2.beat + tolerance && !isHolding) {
    document.getElementById('fb').style.color = 'red';
    document.getElementById('fb').style.fontSize = "200px";
    fb = "MISSED!";
    setTimeout(removeFb, delay);
    console.log("❌ Pose verpasst!", cue2.pose);
    tooSoon = false;
    currentCueIndex2++;
    hasSpawned = false;
    return;
  }


  // 🟢 START der Pose (nur im Fenster erlaubt)
  if (inWindow && currentLabel === cue2.pose && !isHolding && !tooSoon) {
    holdStartTime = beat; // wir schauen ab wann Pose gehlten
    isHolding = true;
    tooSoon = false;
    console.log("Pose gestartet:", cue2.pose);
  }

  // 🟡 HALTEN (IMMER weiter prüfen, egal ob im Fenster!)
  if (isHolding) {
    if (currentLabel === cue2.pose) {

      const heldTime = beat - holdStartTime;

      if (heldTime >= cue2.duration) {
        console.log("✅ Pose gehalten!", cue2.pose);

        document.getElementById('fb').style.color = 'lime';
        document.getElementById('fb').style.fontSize = "200px";
        fb = "SCORE!";
        setTimeout(removeFb, delay);

        isHolding = false;
        holdStartTime = null;

        if (cue2.double == true) {
          points++;
        }
        points++;
        currentCueIndex2++;
        hasSpawned = false;
        document.getElementById("points").innerText = points;
        console.log("You have", points, "points!");
      }

    } else {
      console.log("❌ Pose verloren", cue2.pose);

      document.getElementById('fb').style.color = 'aquamarine';
      document.getElementById('fb').style.fontSize = "200px";
      fb = "BRUH!";
      setTimeout(removeFb, delay);

      isHolding = false;
      holdStartTime = null;
      tooSoon = false;
      currentCueIndex2++;
      hasSpawned = false;
    }
  }
}
//  document.getElementById("rush").innerText = ""



function rush(beat) {


  for (let i = beat; i >= 165;) {
    document.getElementById("r").innerText = "R";
    document.getElementById("u").innerText = "U";
    document.getElementById("s").innerText = "S";
    document.getElementById("h").innerText = "H";

    if (beat >= 190) {
      document.getElementById("r").innerText = "";
      document.getElementById("u").innerText = "";
      document.getElementById("s").innerText = "";
      document.getElementById("h").innerText = "";
    }
    break;
  }
}



const startX = 1600
const travelBeats = 10; // wie viele Beats vorher das Bild startet
const targetX = 1110//window.innerWidth / 2; // Zielposition (z.B. Mitte)
let activeCues = [];
let activeSil = [];




function trySpawn(beat) {
  const cue = cues[currentCueIndex];
  if (!cue) return;

  if (beat >= cue.beat - travelBeats) {

    const img = document.createElement("img");
    const img2 = document.createElement("img");
    img.style.position = "fixed";
    img.style.left = startX + "px";
    img2.style.left = targetX + "px";
    switch (cue.pose) {
      case "pose-1":
        img.src = "pistoleL.png";
        img2.src = "SILL.png"
        break;

      case "pose-2":
        img.src = "pistoleR.png";
        img2.src = "SILR.png"
        break;
    }

    document.body.appendChild(img); //damit es wirklich in html 
    document.body.appendChild(img2);
    const instance = {
      cue,
      element: img,
      spawnBeat: beat,
      started: true,
      finished: false
    };
    const sil = {
      cue,
      element: img2,
      spawnBeat: beat,
      done: false,
      started: true,
      finished: false
    }

    activeCues.push(instance);
    activeSil.push(sil);
    currentCueIndex++;
  }
}


function update(beat) {
  //  console.log("done:", inst.done);

  activeCues.forEach((inst) => {

    const cue = inst.cue;

    //seit her gespawned, wie lange bis despawn
    const progress = (beat - inst.spawnBeat) / (cue.beat - inst.spawnBeat);
    const clamped = Math.max(0, Math.min(progress, 1));

    const x = startX + clamped * (targetX - startX);
    //done = false;
    inst.element.style.left = x + "px";

    // Ziel erreicht
    if (beat >= cue.beat) {

      inst.finished = true;

      inst.element.style.left = targetX + "px";
    }


    // 🧹 Alte Elemente entfernen
    activeCues = activeCues.filter(inst => {
      if (inst.finished) {
        inst.element.remove();

        // done = true;
        return false;
      }
      return true;
    });

  })
}



function update2(beat) {

  activeSil.forEach((inst) => {
    const cue1 = inst.cue;
    inst.done = true;
    if (beat < cue1.beat) {

      inst.done = false;
      console.log("Done: False");


    }
    activeSil = activeSil.filter(inst => {
      if (inst.done) {
        console.log("remove");
        inst.element.remove();

        return false;
      }
      return true;
    });

  })
}




// Spawn ca. 10 Beats vorher
//   if (!hasSpawned && beat >= cue.beat - 30) {
//     console.log("SPAWN");
//     const img = document.createElement("img")
//     switch (cue.pose) {
//       case "pose-1":
//         console.log("poooooo1");
//         poseOver = false;
//         img.src = "pistoleL.png";
//         break;
//       case "pose-2":
//         console.log("poooooo2");
//         poseOver = false;
//         img.src = "pistoleR.png";
//         break;
//     }
//     const startX = window.innerWidth;
//     img.style.left = startX + "px";

//     hasSpawned = true;
//   }
//   if (hasSpawned && !poseOver) {
//     let x = parseFloat(img.style.left) || window.innerWidth;
//     x -= speed;
//     img.style.left = x + "px";
//   }
//   if (beat >= cue.beat) {
//     poseOver = true;
//     console.log("1234567890");
//     img.remove()
//   }
// }




// function move(beat) {
//   if (beat == cues.beat - 10) {
//     console.log("HUHHHÜÜÜÜÜÜÜÜÜÜÜÜ");

//     switch (currentCueIndex) {

//       case (0):
//         img.src = "pistoleL.png";

//         break;

//       case (1):
//         img.src = "pistoleR";

//         break;

//          case (2):
//         img.src = "pistoleL.png";

//         break;

//          case (3):
//         img.src = "pistoleL.png";

//         break;

//         case (4):
//         img.src = "pistoleL.png";

//         break;

//     }
//   }



//   ; img.onload = () => {
//     let x = window.innerWidth; // start at right edge
//     img.style.left = x + "px";


//     x -= speed;
//     img.style.left = x + "px";

//     // stop when beat 
//     if (beat == cues.beat) {
//       // requestAnimationFrame(move);

//     };
//   }
// }
// function checkPoseTiming(beat) {
//   const cue = cues[currentCueIndex];
//   if (!cue) return;

//   if (Math.abs(beat - cue.beat) < tolerance) {
//     console.log("JETZT Pose machen:", cue.pose);
//   }

//   if (beat > cue.beat + tolerance) {
//     currentCueIndex++;
//   }
// }





function onRecognizedPose(label) {
  if (label !== 'unknown') {
    console.log(label);
    Audio.currentbeat
  }
}

/**************************************************************
 * draw and recognize poses
 */


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
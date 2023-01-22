window.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
  ]).then(() => {});
});

const referenceFile = [];
const queryFiles = [];

const getReference = (event) => {
  const file = event.target.files;
  if (!file) return;
  referenceFile.length = 0;
  for (let i = 0; i < file.length; i++) {
    referenceFile.push(file[i]);
  }
};

const uploadPicture = (event) => {
  const fileList = event.target.files;
  if (!fileList) return;
  queryFiles.length = 0;
  for (let i = 0; i < fileList.length; i++) {
    queryFiles.push(fileList[i]);
  }
  // logFiles();
  if (referenceFile && queryFiles.length > 1) {
    compareImage();
  } else {
    console.log(`Please check if there is no faces uploaded`);
    console.log(referenceFile);
    console.log(queryFiles);
  }
};

const logFiles = () => {
  for (let i = 0; i < referenceFile.length; i++) {
    console.log(referenceFile[i].name);
  }
  for (let i = 0; i < queryFiles.length; i++) {
    console.log(queryFiles[i].name);
  }
};

const compareImage = async () => {
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 128,
    scoreThreshold: 0.5,
  });
  try {
    const refImg = new Image();
    refImg.src = URL.createObjectURL(referenceFile[0]);
    const refImage = await faceapi
      .detectSingleFace(refImg, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    if (!refImage) console.log(`Reference image invalid`);
    if (refImage)
      console.log(`Reference Image ${referenceFile[0].name} Added `);

    for (let i = 0; i < queryFiles.length; i++) {
      let queryImg = new Image();
      queryImg.src = URL.createObjectURL(queryFiles[i]);

      const queryImage = await faceapi
        .detectSingleFace(queryImg, options)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!queryImage) {
        console.log(`File ${queryFiles[i].name} face does not recognize`);
      } else {
        console.log(`Query Image ${i + 1}: ${queryFiles[i].name} Added`);

        const distance = faceapi.euclideanDistance(
          refImage.descriptor,
          queryImage.descriptor
        );
        console.log(distance);
        if (distance <= 0.43) {
          console.log(
            `Reference ${referenceFile[0].name} is the same with ${queryFiles[i].name}`
          );
        } else {
          console.log(
            `Reference ${referenceFile[0].name} is not the same with ${queryFiles[i].name}`
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};

document
  .getElementById('get__reference')
  .addEventListener('change', getReference);
document.getElementById('get__files').addEventListener('change', uploadPicture);

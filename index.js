window.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models'),
  ]).then(() => {
    document
      .getElementById('get__reference')
      .addEventListener('change', getReference);
    document
      .getElementById('get__files')
      .addEventListener('change', uploadPicture);
  });
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
  if (referenceFile.length > 0 && queryFiles.length > 0) {
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

const setDescriptor = async (arr, option) => {
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 128,
    scoreThreshold: 0.5,
  });
  for (let i = 0; i < arr.length; i++) {
    const img = new Image();
    img.src = URL.createObjectURL(arr[i]);
    const image = await faceapi
      .detectSingleFace(img, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (option === 'reference') {
      if (!image) {
        console.log(`Reference Image ${i + 1}: ${arr[i].name} face invalid`);
      } else {
        console.log(
          `Reference Image ${i + 1}: ${arr[0].name} descriptor Added `
        );
        arr[i].descriptor = image.descriptor;
      }
    }
    if (option === 'query') {
      if (!image) {
        console.log(`Query Image ${i + 1}: ${arr[i].name} face invalid`);
      } else {
        console.log(`Query Image ${i + 1}: ${arr[i].name} descriptor Added`);
        arr[i].descriptor = image.descriptor;
      }
    }
  }
  console.log(arr);
};
const compareDescriptor = async (refArr, queryArr) => {
  const refDescriptor = [];
  const queryDescriptor = [];
  refArr.map((item, i) => {
    if (item.descriptor) {
      refDescriptor.push(item.descriptor);
      console.log(`Reference Image Descriptor ${i}: ${item.name} added`);
    }
  });
  // const totalReferenceImg = await computeEuclideanDistance(refDescriptor);
  queryArr.map((item, i) => {
    if (item.descriptor) {
      queryDescriptor.push(item.descriptor);
      const distance = faceapi.euclideanDistance(
        refDescriptor[0],
        item.descriptor
      );
      if (distance <= 0.43) {
        console.log(
          `Reference Image and Query Image ${i + 1}: is the same person`
        );
      } else {
        console.log(
          `Reference Image and Query Image ${i + 1}: is the NOT same person`
        );
      }
    }
  });
};

const computeEuclideanDistance = async (arr) => {
  let run = 0;
  let distance;
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i === 0) {
      console.log(i);
      distance = faceapi.euclideanDistance(arr[i], arr[i + 1]);
      run++;
      total = distance;
      console.log(total);
    } else if (i < arr.length - 2) {
      console.log(i);
      const dis = faceapi.euclideanDistance(arr[i + 1], arr[i + 2]);
      run++;
      total = total + dis / 2;
      console.log(total);
    } else if (i === arr.length - 1) {
      console.log(i);
      const dis = faceapi.euclideanDistance(arr[i - 1], arr[i]);
      run++;
      total = total + dis / 2;
      console.log(total);
    }
  }
  console.log(run);
  console.log(`Total Euclidean distance: ${total}`);
  return total;
};

const compareImage = async () => {
  try {
    await setDescriptor(referenceFile, 'reference');
    await setDescriptor(queryFiles, 'query');
    await compareDescriptor(referenceFile, queryFiles);
  } catch (e) {
    console.log(e);
  }
};

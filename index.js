const onePersonCheckbox = document.getElementById('one__person__checkbox');
const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 128,
  scoreThreshold: 0.5,
});
const referenceFile = [];
const queryFiles = [];
const referenceDescriptor = [];
const queryDescriptor = [];

const getReferenceFiles = (event) => {
  const file = event.target.files;
  if (!file) return;
  referenceFile.length = 0;
  referenceDescriptor.length = 0;
  for (let i = 0; i < file.length; i++) {
    referenceFile.push(file[i]);
  }
};

const getQueryFiles = async (event) => {
  const fileList = event.target.files;
  if (!fileList) return;
  queryFiles.length = 0;
  queryDescriptor.length = 0;
  for (let i = 0; i < fileList.length; i++) {
    queryFiles.push(fileList[i]);
  }
  // logFiles();
  if (onePersonCheckbox.checked) {
    await onePersonImageHandler();
  } else if (referenceFile.length > 0 && queryFiles.length > 0) {
    compareImage();
  } else {
    console.log(`Please check if there is no file uploaded`);
    console.log(referenceFile);
    console.log(queryFiles);
  }
};

const setRefDescriptor = async () => {
  for (let i = 0; i < referenceFile.length; i++) {
    const img = new Image();
    img.src = URL.createObjectURL(referenceFile[i]);

    const detection = await faceapi
      .detectSingleFace(img, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (detection > 0)
      return console.log(`There are too many faces. Please put only one`);
    if (!detection)
      return console.log(`There are no face detected in the image`);
    console.log(
      `Reference Image ${referenceFile[i].name} ${i + 1} face descriptor added`
    );
    referenceDescriptor.push({
      name: referenceFile[i].name,
      descriptor: detection.descriptor,
    });
  }
};
const setQueryDescriptor = async () => {
  for (let i = 0; i < queryFiles.length; i++) {
    const img = new Image();
    img.src = URL.createObjectURL(queryFiles[i]);

    const detection = await faceapi
      .detectSingleFace(img, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (detection > 0)
      return console.log(`There are too many faces. Please put only one`);
    if (!detection)
      return console.log(`There are no face detected in the image`);

    console.log(
      `Query Image ${queryFiles[i].name} ${i + 1} face descriptor added`
    );
    queryDescriptor.push({
      name: queryFiles[i].name,
      descriptor: detection.descriptor,
    });
  }
};

const onePersonCompare = async () => {
  const refArrDescriptor = referenceDescriptor.map((val) => val.descriptor);
  const labelRefPerson = new faceapi.LabeledFaceDescriptors(
    referenceDescriptor[0].name,
    refArrDescriptor
  );
  const faceMatcher = new faceapi.FaceMatcher([labelRefPerson]);
  console.log(faceMatcher);
  for (let i = 0; i < queryDescriptor.length; i++) {
    const bestMatch = faceMatcher.findBestMatch(queryDescriptor[i].descriptor);
    console.log(
      `Reference is ${bestMatch.toString()} to query ${
        queryDescriptor[i].name
      } ${i + 1}`
    );
  }
};

const onePersonImageHandler = async () => {
  try {
    await setRefDescriptor();
    await setQueryDescriptor();
    await onePersonCompare();
  } catch (e) {
    console.log(e);
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
          `Reference Image ${i + 1}: ${arr[i].name} descriptor Added `
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

  refArr.map((item, i) => {
    if (item.descriptor) {
      refDescriptor.push({ descriptor: item.descriptor, name: item.name });

      console.log(`Reference Image Descriptor ${i}: ${item.name} added`);
    }
  });
  if (refArr.length === 1) {
    oneReferenceToManyQuery(queryArr, refDescriptor);
  } else {
    const queryDescriptor = queryArr.map((item) => {
      if (item.descriptor) {
        return { descriptor: item.descriptor, name: item.name };
      }
    });

    await computeEuclideanDistance(refDescriptor, queryDescriptor);
  }
};

const oneReferenceToManyQuery = (arr, refDescriptor) => {
  const queryDescriptor = [];
  arr.map((item, i) => {
    if (item.descriptor) {
      queryDescriptor.push(item.descriptor);
      const distance = faceapi.euclideanDistance(
        refDescriptor[0],
        item.descriptor
      );
      compareDistance(distance, i);
    }
  });
};

const compareDistance = (distance, i) => {
  if (distance <= 0.43) {
    if (i) {
      console.log(
        `Reference Image and Query Image ${
          i + 1
        }: is the same person with the distance of ${distance}`
      );
    } else {
      console.log(
        `Reference Image and Query Image: is the same person with the distance of ${distance}`
      );
    }
  } else {
    if (i) {
      console.log(
        `Reference Image and Query Image ${
          i + 1
        }: is the NOT same person with the distance of ${distance}`
      );
    } else {
      console.log(
        `Reference Image and Query Image : is the NOT same person with the distance of ${distance}`
      );
    }
  }
};

const computeEuclideanDistance = async (arr, arr2) => {
  console.log(arr);
  console.log(arr2);

  arr.map((item, i) => {
    arr2.map((val, j) => {
      const distance = faceapi.euclideanDistance(
        item.descriptor,
        val.descriptor
      );

      if (distance <= 0.43) {
        console.log(
          `Reference ${i + i} ${item.name}: is the same person with query ${
            j + 1
          } ${val.name} , with the distance of ${distance}`
        );
      } else {
        console.log(
          `Reference ${i + 1} ${item.name}: is NOT the same person with query ${
            j + 1
          } ${val.name} , with the distance of ${distance}`
        );
      }
    });
  });
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

window.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models'),
  ]).then(() => {
    document
      .getElementById('get__reference')
      .addEventListener('change', getReferenceFiles);
    document
      .getElementById('get__files')
      .addEventListener('change', getQueryFiles);
  });
});

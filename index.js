const onePersonCheckbox = document.getElementById("one__person__checkbox");
const diffPersonCheckbox = document.getElementById("diff__person__checkbox");
const cnnCheckbox = document.getElementById("face__api__js");
const knnCheckbox = document.getElementById("knn__classifier__js");
const referenceInput = document.getElementById("get__reference");
const queryInput = document.getElementById("get__files");
const knnBtn = document.getElementById("knnBtn");

const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 128,
  scoreThreshold: 0.5,
});

let dnn;
let classifierKnn;
let knnClassifier;
let mobilenetModule;
let tinyFaceApiNet;
const split = 0.8;
let numOfTraining;
let numOfTesting;
let featureExtractor;
const referenceFile = [];
const queryFiles = [];
const referenceDescriptor = [];
const queryDescriptor = [];
const distanceThreshold = 0.43;

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

  if (cnnCheckbox.checked && onePersonCheckbox.checked) {
    await onePersonImageHandler();
  } else if (cnnCheckbox.checked && diffPersonCheckbox.checked) {
    await setRefDescriptor();
    await setQueryDescriptor();
    await diffPersonHandler();
  } else if (knnCheckbox.checked && onePersonCheckbox.checked) {
    // if (classifierKnn.getClassifierDataset()) classifierKnn.clearAllClasses();
    await knnClassifierHandler();
  } else {
    console.log(`Please select a checkbox`);
  }
};

const imgToDom = (files) => {
  files.map((file) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.id = file.name;
    document.body.append(img);
  });
};

const knnTrainImg = () => {
  const ref = referenceFile;
  for (let i = 0; i < ref.length; i++) {
    const folderName = ref[i].webkitRelativePath.split("/")[1];
    const image = document.getElementById(ref[i].name);
    imgTrainOnload(image, folderName);
  }
};

const imgTrainOnload = (img, folderName) => {
  img.addEventListener("load", () => {
    const features = featureExtractor.infer(img);
    if (!features) {
      console.log("Face not detected");
    } else {
      console.log(
        `Features of ${folderName} of file name: ${img.id} is being added`
      );
      knnClassifier.addExample(features, folderName);
    }
  });
};

const knnTestImg = async () => {
  console.log(`run`);
  const query = queryFiles;

  for (let i = 0; i < query.length; i++) {
    const image = document.getElementById(query[i].name);
    const features = featureExtractor.infer(image);
    const predict = await knnClassifier.classify(features);
    console.log(`Result of ${query[i].name}`);
    console.log(predict);
  }
};

const knnClassifierHandler = async () => {
  imgToDom(referenceFile);
  imgToDom(queryFiles);
  knnTrainImg();

  knnBtn.addEventListener("click", knnTestImg);
};

const diffPersonHandler = async () => {
  referenceDescriptor.map((ref, i) => {
    const labelRefPerson = new faceapi.LabeledFaceDescriptors(ref.name, [
      ref.descriptor,
    ]);
    const faceMatcher = new faceapi.FaceMatcher(
      [labelRefPerson],
      distanceThreshold
    );
    console.log(faceMatcher);
    queryDescriptor.map((query, j) => {
      const result = faceMatcher.findBestMatch(query.descriptor);

      console.log(
        `Reference ${i + 1} ${ref.name} is ${result.toString()} to ${j + 1} ${
          query.name
        }`
      );
    });
  });
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
    console.log(detection);
    console.log(detection.descriptor);
    console.log(detection.descriptor.toString());
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

    console.log(detection);
    console.log(detection.descriptor);
    console.log(detection.descriptor.toString());
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
  const faceMatcher = new faceapi.FaceMatcher(
    [labelRefPerson],
    distanceThreshold
  );
  console.log(faceMatcher);

  for (let i = 0; i < queryDescriptor.length; i++) {
    const bestMatch = faceMatcher.findBestMatch(queryDescriptor[i].descriptor);
    console.log(
      `the reference is ${bestMatch.toString()} to query ${i + 1} 
      ${queryDescriptor[i].name}`
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

window.addEventListener("DOMContentLoaded", async () => {
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri("./models"),
    (knnClassifier = ml5.KNNClassifier()),
    (dnn = await WebDNN.load("./dnn/")),
  ]).then(async () => {
    console.log(dnn);
    featureExtractor = ml5.featureExtractor("MobileNet");
    console.log(knnClassifier);
    console.log(featureExtractor);
    document
      .getElementById("get__reference")
      .addEventListener("change", getReferenceFiles);
    document
      .getElementById("get__files")
      .addEventListener("change", getQueryFiles);
  });
});

const checkBoxes = (e) => {
  const btn = e.currentTarget;
  if (!btn.checked) return;
  if (btn === onePersonCheckbox) {
    diffPersonCheckbox.checked = false;
  } else {
    onePersonCheckbox.checked = false;
  }
};

const deleteImg = () => {
  const images = document.querySelectorAll("img");
  images.forEach((img) => img.remove());
};

const algorithmCheckboxes = (e) => {
  const btn = e.currentTarget;
  if (!btn.checked) return;
  if (btn === cnnCheckbox) {
    knnCheckbox.checked = false;
    referenceInput.webkitdirectory = false;
    knnBtn.hidden = true;
    deleteImg();
  } else {
    cnnCheckbox.checked = false;
    referenceInput.webkitdirectory = true;
    knnBtn.hidden = false;
  }
};

onePersonCheckbox.addEventListener("click", checkBoxes);
diffPersonCheckbox.addEventListener("click", checkBoxes);
cnnCheckbox.addEventListener("click", algorithmCheckboxes);
knnCheckbox.addEventListener("click", algorithmCheckboxes);

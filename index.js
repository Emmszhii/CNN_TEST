const onePersonCheckbox = document.getElementById("one__person__checkbox");
const diffPersonCheckbox = document.getElementById("diff__person__checkbox");
const cnnCheckbox = document.getElementById("face__api__js");
const knnCheckbox = document.getElementById("knn__classifier__js");
const dnnCheckbox = document.getElementById("dnn__js");
const referenceInput = document.getElementById("get__reference");
const queryInput = document.getElementById("get__files");
const knnBtn = document.getElementById("knnBtn");

const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 128,
  scoreThreshold: 0.5,
});

let dnn;
let output;
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
  if (!file) return console.log("No file detected please try again!");
  referenceFile.length = 0;
  referenceDescriptor.length = 0;
  for (let i = 0; i < file.length; i++) {
    referenceFile.push(file[i]);
  }
};

const getQueryFiles = async (event) => {
  const file = event.target.files;
  if (!file) return console.log("No file detected please try again!");
  queryFiles.length = 0;
  queryDescriptor.length = 0;
  for (let i = 0; i < file.length; i++) {
    queryFiles.push(file[i]);
  }

  if (cnnCheckbox.checked && onePersonCheckbox.checked) {
    await onePersonImageHandler();
  } else if (cnnCheckbox.checked && diffPersonCheckbox.checked) {
    await setRefDescriptor();
    await setQueryDescriptor();
    await diffPersonHandler();
  } else if (knnCheckbox.checked) {
    await knnClassifierHandler();
  } else if (dnnCheckbox.checked) {
    dnnAlgorithmHandler();
  } else {
    console.log(`Please select a checkbox`);
  }
};

const dnnAlgorithmHandler = async () => {
  console.log(`run`);
  try {
    dnnReferenceFiles();
  } catch (e) {
    console.log(e.msg);
  }
};

const dnnReferenceFiles = async () => {
  const files = referenceFile;
  try {
    for (let i = 0; i < files.length; i++) {
      const num = i + 1;
      const newImg = new Image();
      newImg.src = URL.createObjectURL(files[i]);
      newImg.id = files[i].name;
      const detection = await faceapi
        .detectSingleFace(newImg, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection > 0) {
        console.log(
          `reference ${num}: ${newImg.id} too many faces must only consist 1`
        );
      } else if (!detection) {
        console.log(`reference ${num}: ${newImg.id} face not detected`);
      } else {
        console.log(`reference ${num}: ${newImg.id} `);
        console.log(detection);
        referenceDescriptor.push({
          name: referenceFile[i].name,
          descriptor: detection.descriptor,
        });
      }
    }
  } catch (e) {
    console.log(e.message);
  } finally {
    dnnQueryFiles();
  }
};

const dnnQueryFiles = async () => {
  const files = queryFiles;
  console.log(files);
  try {
    for (let i = 0; i < files.length; i++) {
      const num = i + 1;
      const newImg = new Image();
      newImg.src = URL.createObjectURL(files[i]);
      newImg.id = files[i].name;
      const detection = await faceapi
        .detectSingleFace(newImg, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection > 0) {
        console.log(
          `query ${num}: ${newImg.id} too many faces must only consist 1`
        );
      } else if (!detection) {
        console.log(`query ${num}: ${newImg.id} face not detected`);
      } else {
        console.log(`query ${num}: ${newImg.id} `);
        console.log(detection);
        queryDescriptor.push({
          name: files[i].name,
          descriptor: detection.descriptor,
        });
      }
    }
  } catch (e) {
    console.log(e.message);
  } finally {
    console.log(referenceDescriptor);
    console.log(queryDescriptor);
    dnnMatchFace();
  }
};

const dnnMatchFace = () => {
  try {
    onePersonCompare();
  } catch (e) {
    console.log(e.message);
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

    if (detection > 0) {
      console.log(`There are too many faces. Please put only one`);
    } else if (!detection) {
      return console.log(`There are no face detected in the image`);
    } else {
      console.log(
        `Reference Image ${referenceFile[i].name} ${
          i + 1
        } face descriptor added`
      );
      console.log(detection);
      console.log(detection.descriptor.toString());
      referenceDescriptor.push({
        name: referenceFile[i].name,
        descriptor: detection.descriptor,
      });
    }
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

    if (detection > 0) {
      console.log(`There are too many faces. Please put only one`);
    } else if (!detection) {
      console.log(`There are no face detected in the image`);
    } else {
      console.log(detection);
      console.log(detection.descriptor.toString());
      console.log(
        `Query Image ${queryFiles[i].name} ${i + 1} face descriptor added`
      );
      queryDescriptor.push({
        name: queryFiles[i].name,
        descriptor: detection.descriptor,
      });
    }
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
    // CNN
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri("./models"),
    // KNN
    (knnClassifier = ml5.KNNClassifier()),
    (dnn = await WebDNN.load("./dnn/")),
    // DNN
    faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    // classification for face recognition for CNN and DNN
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  ]).then(async () => {
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
    dnnCheckbox.checked = false;
    referenceInput.webkitdirectory = false;
    knnBtn.hidden = true;
  } else if (btn === knnCheckbox) {
    dnnCheckbox.checked = false;
    cnnCheckbox.checked = false;
    referenceInput.webkitdirectory = true;
    knnBtn.hidden = false;
  } else if (btn === dnnCheckbox) {
    cnnCheckbox.checked = false;
    knnCheckbox.checked = false;
    referenceInput.webkitdirectory = false;
    knnBtn.hidden = true;
  }
  deleteImg();
};

onePersonCheckbox.addEventListener("click", checkBoxes);
diffPersonCheckbox.addEventListener("click", checkBoxes);
cnnCheckbox.addEventListener("click", algorithmCheckboxes);
knnCheckbox.addEventListener("click", algorithmCheckboxes);
dnnCheckbox.addEventListener("click", algorithmCheckboxes);

"use client"
import * as faceapi from 'face-api.js';
import Image from 'next/image';
import React, { useRef, useState, useEffect } from 'react';

const WebCamContainer = () => {

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [facesDetected, setFacesDetected] = useState([]);
  const [students, setStudents] = useState([]);
  const [faceDetectInterval, setFaceDetectInterval] = useState([]);
  const [currentNo, setCurrentNo] = useState(0);

  const videoRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = useRef();

  let handle_interval = [];

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]).then(setModelsLoaded(true));
    }
    loadModels();
  }, []);

  useEffect(() => {
    console.log('student changes');
    console.log(students);

    console.log(currentNo);
    // if (students.length > currentNo) {
      setStudents([...new Set(students)]);
      // setCurrentNo(students.length);
    // }

  }, [JSON.stringify(students)])

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  }

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);

    faceDetectInterval.map((a) => {
      clearInterval(a);
      setFaceDetectInterval([]);
    })
  }

  const handleVideoOnPlay = () => {
    setFaceDetectInterval([...faceDetectInterval, setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
        canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        // canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);

        // console.log(detections);
        setFacesDetected(detections);

        const labels = ['Benz', 'Stephen', 'Harry', 'Mike', 'Raf'];

        const labeledFaceDescriptors = await Promise.all(
          labels.map(async label => {

              const imgUrl = `/headshots/${label}.jpg`
              const img = await faceapi.fetchImage(imgUrl)

              const faceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()

              if (!faceDescription) {
                throw new Error(`no faces detected for ${label}`)
              }

              const faceDescriptors = [faceDescription.descriptor]
              return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
          })
        );

        const threshold = 0.6
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, threshold)

        const results = resizedDetections.map(fd => faceMatcher.findBestMatch(fd.descriptor))

        let student_list = [];

        results.forEach((bestMatch, i) => {
            const box = resizedDetections[i].detection.box
            const text = bestMatch.toString()
            const drawBox = new faceapi.draw.DrawBox(box, { label: text })
            drawBox.draw(canvasRef.current)
            // setStudents([...students, [text]]);
            // const reg = /\(0.[0-9]*\)/
            // let student_name = text.replace(reg, '').trim();

            // student_list.push(student_name);
            updateStudentList(text);
          })
      }

    }, 3000)]
  )
  }

  const updateStudentList = (student) => {
    const reg = /\(0.[0-9]*\)/
    let student_name = student.replace(reg, '').trim();

    console.log('Update student');
    console.log(student_name);
    console.log(students);

    if (student_name != 'unknown') {
      // let new_list = [...students, student_name];
      // console.log(new_list);
      // setStudents([...students, [student_name]]);
      console.log('UPDATE');
      // setStudents([...students, student_name]);
      setStudents(students => [...students, student_name])
    }

  }

  const student_cards = students.map(student => {
    // Remove score in the last bit '(xx.xx)'
    const reg = /\(0.[0-9]*\)/
    let student_name = student;
    let student_img_url = `/headshots/${student_name}.jpg`;
    return (
      <div key={student_name} className="inline-block mr-2">
        <Image src={student_img_url} width="150" height="200" alt="img" />
        {student_name}
      </div>
    )
  });

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="mb-4">
        <button onClick={startVideo} className="bg-green-400 mx-3 p-3 rounded-2xl cursor-pointer">
          Start video
        </button>
        <button onClick={closeWebcam} className="bg-red-400 mx-3 p-3 rounded-2xl cursor-pointer">
          Stop video
        </button>
      </div>
      <div className="relative mb-4">
        <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} className="border-solid border-2 border-white"/>
        <canvas ref={canvasRef} className="absolute top-0" />
      </div>
      <div>
        Faces detected:{facesDetected.length}
      </div>
      <div className="">
        {student_cards}
      </div>
    </div>
  )
}

export default WebCamContainer;
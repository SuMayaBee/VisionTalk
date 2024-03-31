import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Button,
  Pressable,
} from "react-native";
import { Camera, CameraType, FlashMode } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import React, { useState, useEffect, useRef } from "react";
import Button1 from "./src/components/Button";
import * as FileSystem from "expo-file-system";
import { Audio, Video, AVPlaybackStatus } from "expo-av";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import Voice from '@react-native-community/voice';
import { set } from "mongoose";

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [flash, setFlash] = useState<FlashMode>(FlashMode.off);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const cameraRef = useRef<Camera | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(
    null
  );
  const [record, setRecord] = useState<any>(null);
  const [status, setStatus] = useState<{}>({});
  const [videoPreview, setVideoPreview] = useState<boolean>(false);
  const intervalId = useRef<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [borderColor, setBorderColor] = useState<"lightgray" | "lightgreen">(
    "lightgray"
  );
  const [isVoiceRecording, setVoiceRecording] = useState<"Release to Send" | "Hold to Speak">("Hold to Speak")
  const [result, setResult] = useState('');
  const [isLoading, setLoading] = useState(false);

  

    const speechStartHandler = (e: any): void => {
      console.log('speechStart successful', e);
    };
    
    const speechEndHandler = (e: any): void => {
      setLoading(false);
      console.log('stop handler', e);
    };
    
    const speechResultsHandler = (e: any): void => {
      const text = e.value[0];
      setResult(text);
    };
  
    const startRecording = async () => {
      setLoading(true);
      try {
        await Voice.start('en-Us');
      } catch (error) {
        console.log('error', error);
      }
    };
  
    const stopRecording = async () => {
      try {
        await Voice.stop();
        setLoading(false);
      } catch (error) {
        console.log('error', error);
      }
    };
  
    const clear = () => {
      setResult('');
    };

    useEffect(() => {
      Voice.onSpeechStart = speechStartHandler;
      Voice.onSpeechEnd = speechEndHandler;
      Voice.onSpeechResults = speechResultsHandler;
      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, []);

  useEffect(() => {
    (async () => {
      MediaLibrary.requestPermissionsAsync();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === "granted");

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === "granted");
    })();
  }, []);

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  if (hasAudioPermission === false) {
    return <Text>No access to audio</Text>;
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        console.log(data);
        setImage(data.uri);

        const base64 = await FileSystem.readAsStringAsync(data.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        //console.log(base64);
        const imageData = `data:image/jpeg;base64,${base64}`;
        //console.log(imageData.substring(0, 1000));
      } catch (e) {
        console.log(e);
      }
    }
  };

  const saveImage = async () => {
    if (image) {
      try {
        await MediaLibrary.createAssetAsync(image);
        alert("Image saved to gallery");
        setImage(null);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const imageToBase64 = async (imageUri: string) => {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  };

  const recordVideo = async () => {
    if (cameraRef.current) {
      if (isRecording) {
        setIsRecording(false);
        // clearTimeout(timeoutId.current); // Stop capturing images
      } else {
        setIsRecording(true);
        const captureImage = async () => {
          if (cameraRef.current) {
            const data = await cameraRef.current.takePictureAsync();
            const base64 = await imageToBase64(data.uri);
            //await sendImageToBackend(base64); // Send the image to the backend
            //timeoutId.current = setTimeout(captureImage, 6000); // Schedule the next image capture
          }
        };
        captureImage(); // Capture image immediately
      }
    }
  };

  return (
    <View style={styles.container}>
      {!image ? (
        <Camera
          style={styles.camera}
          type={type}
          flashMode={flash}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 30,
            }}
          >
            <Button1
              icon={"retweet"}
              onPress={() =>
                setType(
                  type === CameraType.back ? CameraType.front : CameraType.back
                )
              }
            />

            <Button1
              icon={"flash"}
              color={flash === FlashMode.off ? "gray" : "#f1f1f1"}
              onPress={() => {
                setFlash(
                  flash === FlashMode.off ? FlashMode.on : FlashMode.off
                );
              }}
            />
          </View>
        </Camera>
      ) : (
        <Image source={{ uri: image }} style={styles.camera} />
      )}

      <View>
        {image ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 50,
            }}
          >
            <Button1
              title={"Re-take"}
              icon="retweet"
              onPress={() => setImage(null)}
            />
            <Button1 title={"Save"} icon="check" onPress={saveImage} />
          </View>
        ) : (
          <View>
            {isRecording ? (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            
            
              <Pressable
                onPressIn={() => {
                  setBorderColor("lightgreen");
                  //startRecognizing();
                  startRecording();
                  setVoiceRecording("Release to Send")
                  
                }}
                onPressOut={() => {
                  setBorderColor("lightgray");
                  //stopRecognizing();
                  // handleSubmit();
                  stopRecording();
                  setVoiceRecording("Hold to Speak")
                  
                }}
                style={{
                  width: "90%",
                  padding: 30,
                  gap: 10,
                  borderWidth: 3,
                  alignItems: "center",
                  borderRadius: 10,
                  borderColor: borderColor,
                }}
              >
               
                <Text style={styles.welcome}>
                  {isVoiceRecording}
                </Text>
                <Image style={styles.button} source={require("./assets/button.png")} />
                <Text>{result}</Text>
              </Pressable>
              <Button
                title="Replay last message"
                // onPress={async () => await playFromPath(urlPath)}
              />
            
              <Button1
                title={"Stop Recording"}
                icon="video"
                onPress={recordVideo}
              />
            </View>
            ) : (
              <View>
                <Button1
                  title={"Take a picture"}
                  icon="camera"
                  onPress={takePicture}
                />
                <Button1
                  title={"Start Recording"}
                  icon="video"
                  onPress={recordVideo}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 24,
    paddingBottom: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 20,
  },

  headingText: {
    alignSelf: 'center',
    marginVertical: 26,
    fontWeight: 'bold',
    fontSize: 26,
  },
  textInputStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    height: 300,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 0.4,
    color: '#000',
  },
  speak: {
    backgroundColor: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  stop: {
    backgroundColor: 'red',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  clear: {
    backgroundColor: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  btnContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-evenly',
    marginTop: 24,
  },
  button: {
    width: 50,
    height: 50,
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    color: "#ffffff"
  },
});

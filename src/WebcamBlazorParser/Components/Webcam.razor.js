// https://bensonruan.com/how-to-access-webcam-and-take-photo-with-javascript/
//export interface IWebcamProps {
//    webcamElement: HTMLVideoElement,
//    facingMode: string,
//    canvasElement: HTMLCanvasElement | null,
//    snapSoundElement: HTMLAudioElement | null,
//}

export async function newWebcam(props) {
    return new Webcam(props);
}

class Webcam {
    constructor(props) {
        this._webcamElement = props?.webcamElement;
        this._webcamElement.width = this._webcamElement.width || 640;
        this._webcamElement.height = this._webcamElement.height || this._webcamElement.width * (3 / 4);
        this._facingMode = props?.facingMode ?? 'user';
        this._webcamList = [];
        this._streamList = [];
        this._selectedDeviceId = '';
        this._snapSoundElement = props?.snapSoundElement;
    }

    _webcamElement;// : HTMLVideoElement;
    _facingMode; //: string;
    _webcamList; //: MediaDeviceInfo[];
    _streamList; //: MediaStream[];
    _selectedDeviceId; //: string;
    _snapSoundElement; //: HTMLAudioElement | null = null;
    _isStreaming = false;

    get facingMode() { return this._facingMode; };
    set facingMode(value) { this._facingMode = value; };

    get isStreaming() { return this._isStreaming; }
    set isStreaming(value) { this._isStreaming = value; }

    get webcamList() { return this._webcamList; }
    get webcamCount() { return this._webcamList.length; }

    get selectedDeviceId() { return this._selectedDeviceId; }

    // Get all video input devices info 
    getVideoInputs(mediaDevices) { // MediaDeviceInfo[]
        this._webcamList = [];
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                this._webcamList.push(mediaDevice);
            }
        });
        if (this._webcamList.length === 1) {
            this._facingMode = 'user';
        }
        return this._webcamList;
    }

    // Get media constraints
    getMediaConstraints() { // MediaStreamConstraints
        var videoConstraints = {}; // MediaTrackConstraints
        if (this._selectedDeviceId === '') {
            videoConstraints.facingMode = this._facingMode;
        } else {
            videoConstraints.deviceId = { exact: this._selectedDeviceId };
        }
        var constraints = { // MediaStreamConstraints
            video: videoConstraints,
            audio: false
        };
        return constraints;
    }

    // Select camera based on facingMode
    selectCamera() {
        for (let webcam of this._webcamList) {
            if ((this._facingMode === 'user' && webcam.label.toLowerCase().includes('front'))
                || (this._facingMode === 'enviroment' && webcam.label.toLowerCase().includes('back'))
            ) {
                this._selectedDeviceId = webcam.deviceId;
                break;
            }
        }
    }

    // Change Facing mode and selected camera
    flip() {
        this._facingMode = (this._facingMode === 'user') ? 'enviroment' : 'user';

        if (this._facingMode === 'user') {
            this._webcamElement.style.transform = "scale(-1,1)";
        } else {
            this._webcamElement.style.transform = "scale(1,1)";
        }

        this.selectCamera();
    }

    //   1. Get permission from user
    //   2. Get all video input devices info
    //   3. Select camera based on facingMode 
    //   4. Start stream
    async startAsync(startStream = true) {
        try {
            this.stop();
            const stream = await navigator.mediaDevices.getUserMedia(this.getMediaConstraints()); //get permisson from user
            this._streamList.push(stream);
            await this.infoAsync(); //get all video input devices info
            this.selectCamera();   //select camera based on facingMode
            this._isStreaming = true;
            if (startStream) {
                await this.streamAsync();
                return this._facingMode;
            } else {
                return this._selectedDeviceId;
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Get all video input devices info
    async infoAsync() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.getVideoInputs(devices);
            return this._webcamList;
        } catch (error) {
            console.log(error);
        }
    }

    // Start streaming webcam to video element
    async streamAsync() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(this.getMediaConstraints());
            this._streamList.push(stream);
            this._webcamElement.srcObject = stream;
            if (this._facingMode === 'user') {
                this._webcamElement.style.transform = "scale(-1,1)";
            } else {
                this._webcamElement.style.transform = "scale(1,1)";
            }
            this._webcamElement.play();
            return this._facingMode;
        } catch (error) {
            console.log(error);
        }
    }

    // Stop streaming webcam
    stop() {
        this._streamList.forEach(stream => {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        });
        this._isStreaming = false;
    }

    clearCapture(canvasElement) {
        if (canvasElement) {
            let context = canvasElement.getContext('2d');
            context?.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
    }

    capture(canvasElement, webcamSnapshotElement) {
        if (canvasElement == null) {
            console.error("Canvas element is not set");
            return;
        }

        if (this._snapSoundElement != null) {
            this._snapSoundElement.play();
        }
        canvasElement.height = this._webcamElement.scrollHeight;
        canvasElement.width = this._webcamElement.scrollWidth;
        let context = canvasElement.getContext('2d');
        if (this._facingMode === 'user') {
            context?.translate(canvasElement.width, 0);
            context?.scale(-1, 1);
        } else {
            context?.translate(0, 0);
            context?.scale(1, 1);
        }
        context?.clearRect(0, 0, canvasElement.width, canvasElement.height);
        context?.drawImage(this._webcamElement, 0, 0, canvasElement.width, canvasElement.height);

        webcamSnapshotElement.href = canvasElement.toDataURL('image/png');
        //const dataUrl = canvasElement.toDataURL('image/png');
        //return dataUrl;
    }
}

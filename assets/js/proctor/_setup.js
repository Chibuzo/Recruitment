(function($, win, doc) {
    'use strict';

    if(!$) console.warn('Proctor: No library found. Use jQuery or MLIB');

    var defaults, proctor;

    defaults = {
        /**
         * @summary Proctor INtegrity score per instance
         */
        integrityScore: 100,
        /**
         * @summary Ignore Recording
         */
        ignoreRecording: false,
        /**
         * @summary Ignore Tracking
         */
        ignoreTrack: false,
        /**
         * @summary Video if or class
         */
        video: '#proctor-canvas',
        /**
         * @summary Canvas id or class
         */
        cavnas: '#proctor-canvas',
        /**
         * Perform a function on face tracked
         * @type function
         */
        onFaceTracked: function() {},
        /**
         * Perform a function on multi face tracked
         * @type function
         */
        onMultiFaceTracked: function() {},
        /**
         * Take snaphot on proctor intialization and face tracked
         * @type boolean
         */
        takeInitialSnapshot: false,
        /**
         * @summary Do something with the snapshot taken (upload|display...) Data is in base64
         * @type function
         * @param data64 {Object} Image file in base64
         */
        handleSnapshot: function(data64) {},
        /**
         * Ambient noise detection
         */
        onAmbientNoiseDetection: function() {

        },
        /**
         * @summary This plugin is on the bleeding edge of tech. Gracefully handle exceptions
         */
        handleOutdatedBrowser: function() {},
        /**
         * Microphone permission denied
         */
        onMicPermissionDenied: function() {},
        /**
         * Webcam permission denied
         */
        onCamPermissionDenied: function() {},
        /**
         * Proctor ready
         */
        proctorReady: function() {

        }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.enumerateDevices = function(callback) {
            navigator.mediaDevices.enumerateDevices().then(callback);
        };
    }

    var MediaDevices = [], isHTTPs = location.protocol === 'https:', canEnumerate = false;

    if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
        canEnumerate = true;
    } else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
        canEnumerate = true;
    }

    var hasMicrophone = false, hasSpeakers = false, hasWebcam = false;
    var isMicrophoneAlreadyCaptured = false, isWebcamAlreadyCaptured = false;

    function checkDeviceSupport(callback) {
        if(!canEnumerate) {
            return;
        }

        if(!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
            navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
        }

        if(!navigator.enumerateDevices && navigator.enumerateDevices) {
            navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
        }

        if(!navigator.enumerateDevices) {
            if (callback) {
                callback();
            }
            return;
        }

        MediaDevices = [];
        navigator.enumerateDevices(function(devices) {
            devices.forEach(function(_device) {
                var device = {};
                for (var d in _device) {
                    device[d] = _device[d];
                }

                if (device.kind === 'audio') {
                    device.kind = 'audioinput';
                }

                if (device.kind === 'video') {
                    device.kind = 'videoinput';
                }

                var skip;
                MediaDevices.forEach(function(d) {
                    if (d.id === device.id && d.kind === device.kind) {
                        skip = true;
                    }
                });

                if(skip) {
                    return;
                }

                if(!device.deviceId) {
                    device.deviceId = device.id;
                }

                if(!device.id) {
                    device.id = device.deviceId;
                }

                if(!device.label) {
                    device.label = 'Please invoke getUserMedia once.';
                    if (!isHTTPs) {
                        device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                    }
                } else {
                    if(device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
                        isWebcamAlreadyCaptured = true;
                    }

                    if(device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
                        isMicrophoneAlreadyCaptured = true;
                    }
                }

                if(device.kind === 'audioinput') {
                    hasMicrophone = true;
                }

                if(device.kind === 'audiooutput') {
                    hasSpeakers = true;
                }

                if(device.kind === 'videoinput') {
                    hasWebcam = true;
                }

                // there is no 'videoouput' in the spec.
                MediaDevices.push(device);
            });

            if(callback) {
                callback();
            }
        });
    }

    proctor = function(options) {
        // Initialize proctor and begin instance
        this.opts = $.extend({}, defaults, options);

        this.opts.takeInitialSnapshot && (this.initialSnap = false);

        this.$video = $(this.opts.video), this.video = this.$video[0];
        this.$canvas = $(this.opts.canvas), this.canvas = this.$canvas[0];

        if((!this.video || !this.canvas) && !this.opts.ignoreTrack)
            return console.warn('Proctor: Video or Canvas not found');

        return this.init();
    }

    proctor.prototype.init = function() {
        var pc = this;

        /* making sure user browser is updated and can take photos via webcam html5 */
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia );

        checkDeviceSupport(function() {
            // log device has no cam
            if(!hasWebcam) return console.log('Proctor: Webcam not found');
            // log device has no mic
            if(!hasMicrophone) return console.log('Proctor: Microphone not found');

            /* handle browser support for tracker and recorder */
            if((!pc.opts.ignoreRecording && !navigator.getUserMedia) || (!pc.opts.ignoreRecording && !Recorder.isRecordingSupported())) {
                return pc.opts.handleOutdatedBrowser();
            };

            // log cam persmission not granted
            !isWebcamAlreadyCaptured && !pc.opts.ignoreTrack && console.warn('Proctor: Webcam needed to work'),
            // log mic permission not granted
            !isMicrophoneAlreadyCaptured && !pc.opts.ignoreRecording && console.warn('Proctor: Microphone needed to work');

            // request webcam and mic permissions
            if((!isWebcamAlreadyCaptured && !pc.opts.ignoreTrack) || (!isMicrophoneAlreadyCaptured && !pc.opts.ignoreRecording)) return navigator.getUserMedia({audio: true, video: true}, function(stream) { pc.proctor(); }, function(e) {});

            pc.proctor();
        });

        return this;
    }, proctor.prototype.proctor = function() {
        !this.opts.ignoreTrack && this.beginTrack(),
        !this.opts.ignoreRecording && this.prepareRecorder();

        this.beginAudioTracking();
    }, proctor.prototype.beginTrack = function() {
        var pc = this;
        var context = pc.context = this.canvas.getContext('2d');

        var tracker = new tracking.ObjectTracker('face');
        tracker.setInitialScale(4);
        tracker.setStepSize(1);
        tracker.setEdgesDensity(0.1);

        tracking.track(this.video, tracker, { camera: true });

        tracker.on('track', function(event) {
            context.clearRect(0, 0, pc.canvas.width, pc.canvas.height);

            !pc.trackerReady && (pc.trackerReady = true, pc.setProctorReady());

            if(event.data.length === 0) {
                // nothing was tracked
            } else {
                event.data.forEach(function(rect) {
                    pc.onFaceTracked(rect);

                    event.data.length > 1 && pc.onMultiFaceTracked(rect);
                });
            }
        });
    }, proctor.prototype.onFaceTracked = function(rect) {
        this.context.strokeStyle = 'rgba(255, 255, 255, .8)';
        this.context.font = '11px Helvetica';
        this.context.fillStyle = "#fff";

        this.context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        this.context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
        this.context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);

        this.initialSnap === false && (this.takeSnapShot(rect), this.initialSnap = true);
    }, proctor.prototype.onMultiFaceTracked = function(rect) {
        this.takeSnapShot(rect),
        this.opts.onMultiFaceTracked();
    }, proctor.prototype.takeSnapShot = function(rect) {
        this.context.drawImage(this.video, 0, 0, 640, 360);
        this.opts.handleSnapshot(this.canvas.toDataURL("image/jpeg", 1));
    };

    proctor.prototype.beginAudioTracking = function() {
        var pc = this;
        this.audioContext = null,
        this.meter = null,
        this.meterWidth = 500,
        this.meterHeight = 50,
        this.rafID = null,
        this.mediaStreamSource;

        this.$meter = $("#vol-meter");

        // monkeypatch Web Audio
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        // grab an audio context
        this.audioContext = new AudioContext();

        function drawLoop( time ) {
            if(pc.$meter[0]) {
                pc.$meter.css({
                    width: pc.meterWidth + 'px',
                    height: pc.meterHeight + 'px'
                })

                if (pc.meter.checkClipping())
                    pc.$meter.css({ background: 'red' })
                else
                    pc.$meter.css({ background: 'green' })

                pc.$meter.css({ width: pc.meter.volume * pc.meterWidth * 1.4 + 'px' });
            }

            var pitch = pc.meter.volume * 100;

            if(pitch >= 5) {
                pc.opts.onAmbientNoiseDetection(),
                pc.recorder.start(), setTimeout(function() {
                    pc.recorder.stop();
                }, 15000);
            }

            //console.log('Proctor: Pitch -> ' + pitch);

            // set up the next visual callback
            pc.rafID = window.requestAnimationFrame(drawLoop);
        }

        try {
            // ask for an audio input
            navigator.getUserMedia({
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, function(stream) {
                console.log('Proctor: Listening');
                // Create an AudioNode from the stream.
                pc.mediaStreamSource = pc.audioContext.createMediaStreamSource(stream);

                // Create a new volume meter and connect it.
                pc.meter = createAudioMeter(pc.audioContext);
                pc.mediaStreamSource.connect(pc.meter);

                // kick off the visual updating
                drawLoop();
            }, function(e) {});
        } catch(e) {
            console.log('Proctor: getUserMedia threw exception :' + e);
        }
    },

    proctor.prototype.prepareRecorder = function() {
        var pc = this;

        pc.recorderReady = false;

        this.recorder = new Recorder({
            monitorGain: parseInt(0, 10),
            numberOfChannels: parseInt(1, 10),
            wavBitDepth: parseInt(16, 10),
            encoderPath: "/js/proctor/waveWorker.min.js"
        });

        this.recorder.addEventListener("start", function(e){
            console.log('Proctor: Recorder is started');
        });
        this.recorder.addEventListener("stop", function(e){
            console.log('Proctor: Recorder is stopped');
        });
        this.recorder.addEventListener("pause", function(e){
            console.log('Proctor: Recorder is paused');
        });
        this.recorder.addEventListener("resume", function(e){
            console.log('Proctor: Recorder is resuming');
        });
        this.recorder.addEventListener("streamError", function(e){
            console.log('Proctor: Error encountered: ' + e.error.name );
        });
        this.recorder.addEventListener("streamReady", function(e){
            pc.recorderReady = true, pc.setProctorReady();
            console.log('Proctor: Audio stream is ready.');
        });
        this.recorder.addEventListener("dataAvailable", function(e){
            var dataBlob = new Blob( [e.detail], { type: 'audio/wav' } );
            var reader = new window.FileReader();
            reader.readAsDataURL(dataBlob);
            reader.onloadend = function() {
                var base64data = reader.result;
                pc.opts.handleAudio(base64data);
            }
        });

        this.recorder.initStream()
    };

    proctor.prototype.setProctorReady = function() {
        var proctor = false;

        // check if mic/recorder is not ignored and ready
        proctor = !this.opts.ignoreRecording && this.recorderReady ? true : false;
        // check if camera/tracker is not ignored and ready
        proctor = !this.opts.ignoreTrack && this.trackerReady ? true : false;

        // Default on proctor ready state
        proctor && this.opts.proctorReady();
    };

    win.Proctor = proctor;
})('undefined' != typeof jQuery && jQuery, window, document)

//$(document).ready(function() {
function startProctor() {
    /**
     * integrity score measurement
     * You can use the (onMultiFaceTracked) option for the (-15) deduction on track
     */
    var integrityScore = 100;

    new Proctor({
        ignoreRecording: false,
        ignoreTrack: false,

        video: '#proctor-video',
        canvas: '#proctor-canvas',

        takeInitialSnapshot: true,

        handleOutdatedBrowser: function () {
            alert('Update your browser ma niggah');
        },

        handleSnapshot: function (data64) {
            $.ajax({
                type: "POST",
                url: "/gqtest/uploadProctorPicture",
                data: {
                    imgBase64: data64
                }, success: function (data) {
                    // Some success ish blah blah
                }, error: function () {
                    // some error handling blah nlah
                }
            }).done(function (msg) {
                // Some message blah blah
            });
        },
        handleAudio: function (data64) {
            $.ajax({
                type: "POST",
                url: "/gqtest/uploadProctorAudio",
                data: {
                    data: data64
                }, success: function (data) {
                    // Some success ish blah blah
                }, error: function () {
                    // some error handling blah nlah
                }
            }).done(function (msg) {
                // Some message blah blah
            });
        },

        onFaceTracked: function (e) {
            // on face detected
        },
        // Integrity scoring can be applied here
        onMultiFaceTracked: function () {
            // on multi face detected
            integrityScore -= integrityScore > 0 ? 5 : 0;
            controlIntegrityBar(integrityScore);
            //$('.progress-bar').animate({ width: integrityScore + '%' });
        },
        // Integrity score deduction can be applied here
        onAmbientNoiseDetection: function () {
            integrityScore -= integrityScore > 0 ? 1 : 0;
            controlIntegrityBar(integrityScore);
        },

        onMicPermissionDenied: function () {
            console.log('Proctor: Microphone needed for this test');
            blockTest();
        },
        onCamPermissionDenied: function () {
            console.log('Proctor: Webcam needed for this test');
            blockTest();
        },

        proctorReady: function () {
            console.log('Proctor is ready...');
        }
    })
}
//})

function blockTest() {
    $("#inner-test-div").fadeOut('fast', function() {
        $(".test-blocked-screen").removeClass('hidden');
    });
}


function controlIntegrityBar(integrityScore) {
    if (integrityScore < 70 && integrityScore > 55) {
        $(".progress-bar").removeClass('progress-bar-success').addClass('progress-bar-warning');
    }
    else if (integrityScore < 55) {
        $(".progress-bar").removeClass('progress-bar-warning').addClass('progress-bar-danger');
    }
    $('.progress-bar').css('width', integrityScore + "%");
}
// $(document).ready(function() {
//     var obj = JSON.parse(localStorage.getItem('video_check'));
//     can_upload = new Date(obj.tried_video_update);
//     if (can_upload) {
//         console.log(can_upload)
//         var __now = new Date();
//         if (can_upload.getTime() + (30 * 60 * 1000) > __now.getTime()) {
//             $('.select-file-button').prop('disabled', true);
//             console.log(new Date(can_upload + (30 * 60 * 1000)))
//             var rem = Math.abs(can_upload.getTime() + (30 * 60 * 1000) - __now);
//             console.log('Raw new: ' + rem);
//             var ndate = new Date(rem);
//             console.log('Date Object: ' + ndate);
//             $(".video-alert").text("You can not re upload a video now. Please try again in " + ndate.getMinutes() + " minutes.").removeClass('hidden');
//         } else {
//             $(".select-file-button").prop('disabled', false);
//             $(".video-alert").text("").addClass('hidden');
//         }
//     }
// });

var TOKEN;

$.ajax({
    url: 'https://getqualified.work/js/getYoutubeAccessToken',
    success: function (e) {
        if (e && e.access_token) {
            TOKEN = e.access_token;
            initClient();
        }
    }
})


var selectedFile;
var pavp;
$(document).ready(function() {
    $(".record-video").click(function() {
        //$(".gq-video-canvass").hide();
        $("#videoRecorderModal").modal();
        pavp = new Pavp({
            onUploadButtonClicked: function($this, video_file) {
                selectedFile = video_file;
                defineRequest();
            }
        });
    });

    $("#videoRecorderModal").on("hidden.bs.modal", function () {
        pavp.stop();
    });
});


function initClient() {
    $(".select-file-button").click(function () {
        $("#select-file").click();
    }),

    $("#select-file").bind("change", function () {
        selectedFile = $("#select-file").prop("files")[0];
        $(".select-file-button").html("<i class='fa fa-cog fa-spin'></i> Uploading...").prop('disabled', true);
        defineRequest();
    });
}

function createResource(properties) {
    var resource = {};
    var normalizedProps = properties;
    for (var p in properties) {
        var value = properties[p];
        if (p && p.substr(-2, 2) == '[]') {
            var adjustedName = p.replace('[]', '');
            if (value) {
                normalizedProps[adjustedName] = value.split(',');
            }
            delete normalizedProps[p];
        }
    }

    for (var p in normalizedProps) {
        // Leave properties that don't have values out of inserted resource.
        if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
            var propArray = p.split('.');
            var ref = resource;
            for (var pa = 0; pa < propArray.length; pa++) {
                var key = propArray[pa];
                if (pa == propArray.length - 1) {
                    ref[key] = normalizedProps[p];
                } else {
                    ref = ref[key] = ref[key] || {};
                }
            }
        }
        ;
    }
    return resource;
}

function removeEmptyParams(params) {
    for (var p in params) {
        if (!params[p] || params[p] == 'undefined') {
            delete params[p];
        }
    }
    return params;
}

function executeRequest(request) {
    request.execute(function (response) {
        console.log(response);
    });
}

function buildApiRequest(requestMethod, path, params, properties) {
    params = removeEmptyParams(params);
    var request;
    if (properties) {
        var resource = createResource(properties);
        request = gapi.client.request({
            'body': resource,
            'method': requestMethod,
            'path': path,
            'params': params
        });
    } else {
        request = gapi.client.request({
            'method': requestMethod,
            'path': path,
            'params': params
        });
    }
    executeRequest(request);
}

/**
 * Retrieve the access token for the currently authorized user.
 */
function getAccessToken(event) {
    return TOKEN;
}

/**
 * Helper for implementing retries with backoff. Initial retry
 * delay is 1 second, increasing by 2x (+jitter) for subsequent retries
 *
 * @constructor
 */
var RetryHandler = function () {
    this.interval = 1000; // Start at one second
    this.maxInterval = 60 * 1000; // Don't wait longer than a minute
};

/**
 * Invoke the function after waiting
 *
 * @param {function} fn Function to invoke
 */
RetryHandler.prototype.retry = function (fn) {
    setTimeout(fn, this.interval);
    this.interval = this.nextInterval_();
};

/**
 * Reset the counter (e.g. after successful request.)
 */
RetryHandler.prototype.reset = function () {
    this.interval = 1000;
};

/**
 * Calculate the next wait time.
 * @return {number} Next wait interval, in milliseconds
 *
 * @private
 */
RetryHandler.prototype.nextInterval_ = function () {
    var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
    return Math.min(interval, this.maxInterval);
};

/**
 * Get a random int in the range of min to max. Used to add jitter to wait times.
 *
 * @param {number} min Lower bounds
 * @param {number} max Upper bounds
 * @private
 */
RetryHandler.prototype.getRandomInt_ = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Helper class for resumable uploads using XHR/CORS. Can upload any
 * Blob-like item, whether files or in-memory constructs.
 *
 * @example
 * var content = new Blob(["Hello world"], {"type": "text/plain"});
 * var uploader = new MediaUploader({
    *   file: content,
    *   token: accessToken,
    *   onComplete: function(data) { ... }
    *   onError: function(data) { ... }
    * });
 * uploader.upload();
 *
 * @constructor
 * @param {object} options Hash of options
 * @param {string} options.token Access token
 * @param {blob} options.file Blob-like item to upload
 * @param {string} [options.fileId] ID of file if replacing
 * @param {object} [options.params] Additional query parameters
 * @param {string} [options.contentType] Content-type, if overriding the
 *    type of the blob.
 * @param {object} [options.metadata] File metadata
 * @param {function} [options.onComplete] Callback for when upload is complete
 * @param {function} [options.onProgress] Callback for status of in-progress
 *    upload
 * @param {function} [options.onError] Callback if upload fails
 */
var MediaUploader = function (options) {
    var noop = function () {
    };
    this.file = options.file;
    this.contentType = options.contentType || this.file.type || 'application/octet-stream';
    this.metadata = options.metadata || {
            'title': this.file.name,
            'mimeType': this.contentType
        };
    this.token = options.token;
    this.onComplete = options.onComplete || noop;
    this.onProgress = options.onProgress || noop;
    this.onError = options.onError || noop;
    this.offset = options.offset || 0;
    this.chunkSize = options.chunkSize || 0;
    this.retryHandler = new RetryHandler();

    this.url = options.url;
    if (!this.url) {
        var params = options.params || {};
        params.uploadType = 'resumable';
        this.url = this.buildUrl_(options.fileId, params, options.baseUrl);
    }
    this.httpMethod = options.fileId ? 'PUT' : 'POST';
};

/**
 * Initiate the upload.
 */
MediaUploader.prototype.upload = function () {
    var self = this;
    var xhr = new XMLHttpRequest();

    xhr.open(this.httpMethod, this.url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Upload-Content-Length', this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);

    xhr.onload = function (e) {
        if (e.target.status < 400) {
            var location = e.target.getResponseHeader('Location');
            this.url = location;
            this.sendFile_();
        } else {
            this.onUploadError_(e);
        }
    }.bind(this);
    xhr.onerror = this.onUploadError_.bind(this);
    xhr.send(JSON.stringify(this.metadata));
};

/**
 * Send the actual file content.
 *
 * @private
 */
MediaUploader.prototype.sendFile_ = function () {
    var content = this.file;
    var end = this.file.size;

    if (this.offset || this.chunkSize) {
        // Only slice the file if we're either resuming or uploading in chunks
        if (this.chunkSize) {
            end = Math.min(this.offset + this.chunkSize, this.file.size);
        }
        content = content.slice(this.offset, end);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Type', this.contentType);
    xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
        xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send(content);
};

/**
 * Query for the state of the file for resumption.
 *
 * @private
 */
MediaUploader.prototype.resume_ = function () {
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Range', 'bytes */' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
        xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send();
};

/**
 * Extract the last saved range if available in the request.
 *
 * @param {XMLHttpRequest} xhr Request object
 */
MediaUploader.prototype.extractRange_ = function (xhr) {
    var range = xhr.getResponseHeader('Range');
    if (range) {
        this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
    }
};

/**
 * Handle successful responses for uploads. Depending on the context,
 * may continue with uploading the next chunk of the file or, if complete,
 * invokes the caller's callback.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadSuccess_ = function (e) {
    if (e.target.status == 200 || e.target.status == 201) {
        this.onComplete(e.target.response);
    } else if (e.target.status == 308) {
        this.extractRange_(e.target);
        this.retryHandler.reset();
        this.sendFile_();
    }
};

/**
 * Handles errors for uploads. Either retries or aborts depending
 * on the error.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadError_ = function (e) {
    if (e.target.status && e.target.status < 500) {
        this.onError(e.target.response);
    } else {
        this.retryHandler.retry(this.resume_.bind(this));
    }
};

/**
 * Handles errors for the initial request.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onUploadError_ = function (e) {
    this.onError(e.target.response); // TODO - Retries for initial upload
};

/**
 * Construct a query string from a hash/object
 *
 * @private
 * @param {object} [params] Key/value pairs for query string
 * @return {string} query string
 */
MediaUploader.prototype.buildQuery_ = function (params) {
    params = params || {};
    return Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
};

/**
 * Build the upload URL
 *
 * @private
 * @param {string} [id] File ID if replacing
 * @param {object} [params] Query parameters
 * @return {string} URL
 */
MediaUploader.prototype.buildUrl_ = function (id, params, baseUrl) {
    var url = baseUrl;
    if (id) {
        url += id;
    }
    var query = this.buildQuery_(params);

    if (query) {
        url += '?' + query;
    }
    return url;
};

function defineRequest() {
    // display video infor
    $(".vid-info").removeClass('hidden');

    // let's see if there's an old video and then delete it, we badt like that
    if ($("#video_id").text().length > 3) {
        $.post('/deleteYoutubeVideo', { video_id: $("#video_id").text() });
    }

    // register the time of this event
    var obj = { tried_video_update: new Date().getTime() };
    localStorage.setItem('video_check', JSON.stringify(obj));

    var metadata = createResource({
        'snippet.categoryId': '22',
        'snippet.defaultLanguage': '',
        'snippet.description': 'Candidate Profile Video',
        'snippet.tags[]': '',
        'snippet.title': $("#candidate_fullname").text(),
        'status.embeddable': '',
        'status.license': '',
        'status.privacyStatus': 'unlisted',
        'status.publicStatsViewable': ''
    });

    var token = getAccessToken();

    if (!token) {
        alert("You need to authorize the request to proceed.");
        return;
    }

    if (!selectedFile) {
        alert("You need to select a file to proceed.");
        return;
    }

    var params = {'part': 'snippet,status'};

    var uploader = new MediaUploader({
        baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
        file: selectedFile,
        token: token,
        metadata: metadata,
        params: params,
        onError: function (data) {
            var message = data;

            try {
                amplitude.getInstance().logEvent("User Upload Video Error", {
                    data: JSON.stringify(data)
                });

                var errorResponse = JSON.parse(data);
                console.log(errorResponse);
                message = errorResponse.error.message;
            } finally {
                console.log(message);
                alert(message);
            }
            console.error(message)

        }.bind(this),
        onProgress: function (data) {
            var currentTime = Date.now();
            var perc = Math.round((data.loaded / data.total) * 100);
            $('#progressBar span.sr-only').text(perc + '%');
            $('#progressBar').css('width', perc + '%');
           // $('.progress-bar').css('width', integrityScore + "%");
            console.log('Progress: ' + data.loaded + ' bytes loaded out of ' + data.total);
            var totalBytes = data.total;
        }.bind(this),
        onComplete: function (data) {
            pavp.stop();
            var uploadResponse = JSON.parse(data);
            console.log(uploadResponse);

            amplitude.getInstance().logEvent("User Uploaded Video", {
                videoId: uploadResponse.id
            });

            $.post('/applicant/updateYoutubeId', { video_id: uploadResponse.id }, function() {
                location.reload(true);
            });
            //console.log('Upload complete for video ' + uploadResponse.id);
        }.bind(this)
    });

    uploader.upload();
}

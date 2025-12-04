import { StreamEncodesDetail } from "../features/dropdown/dropdownTypes";

export const streamEncodes: StreamEncodesDetail[] = [
  {
    "id": 1,
    "encode_name": "H264",
    "gstreamer_format": "drop-on-latency=1 latency=0 ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 min-threshold-time=10 ! rtph264depay ! h264parse ! decodebin ! videoconvert ! video/x-raw,format=BGR ! videoconvert ! appsink name=sink max-buffers=5\n",
    "visible": true,
    "active": true,
    created_at: "string",
    updated_at: "string",
  },
  {
    "id": 2,
    "encode_name": "H265",
    "gstreamer_format": "drop-on-latency=1 latency=0 ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 min-threshold-time=10 ! rtph265depay ! h265parse ! decodebin ! videoconvert ! video/x-raw,format=BGR ! videoconvert ! appsink name=sink max-buffers=5",
    "visible": true,
    "active": true,
    created_at: "string",
    updated_at: "string",
},
  {
    "id": 3,
    "encode_name": "MJPEG",
    "gstreamer_format": "drop-on-latency=1 latency=0 ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 min-threshold-time=10 ! rtpjpegdepay ! jpegdec ! videoconvert ! video/x-raw,format=BGR ! videoconvert ! appsink name=sink max-buffers=5",
    "visible": true,
    "active": true,
    created_at: "string",
    updated_at: "string",
  }
]
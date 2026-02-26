import { useEffect, useState } from "react";

interface VideoPlayerProps {
  streamUrl: string | null;
  id: string;
  customClass?: string;
}

const FALLBACK_IMAGE = "/images/no_image.png";

const isMp4 = (url?: string | null) => !!url && /\.(mp4|webm)$/i.test(url);

export const VideoPlayer = ({ streamUrl, id, customClass }: VideoPlayerProps) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [streamUrl]);

  if (!streamUrl || error) {
    return (
      <div className={`overflow-hidden ${customClass || ""}`}>
        <img
          src={FALLBACK_IMAGE}
          className={`w-full h-full object-contain`}
          alt="No stream"
        />
      </div>
    );
  }

  if (isMp4(streamUrl)) {
    return (
      <div className={`overflow-hidden ${customClass || ""}`}>
        <video
          id={id}
          src={streamUrl}
          className={"w-full h-full object-contain"}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${customClass || ""}`}>
      <img
        id={id}
        src={streamUrl}
        className={"w-full h-full object-contain"}
        alt="MJPEG Stream"
        onError={() => setError(true)}
      />
    </div>
  );
};
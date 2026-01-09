import { useState, useEffect, useRef } from "react";

interface VideoPlayerProps {
  streamUrl: string | null;
  id: number;
  customClass?: string;
  isMjpeg?: boolean;
}


const FALLBACK_IMAGE = "/images/no-image.png";

/* ---------------- MJPEG Player ---------------- */
const MjpegPlayer = ({ streamUrl, customClass }: VideoPlayerProps) => {

  const [src, setSrc] = useState(streamUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setSrc(streamUrl || FALLBACK_IMAGE);
  }, [streamUrl]);

  return (
    <div className={`overflow-hidden ${customClass || ""}`}>
      <img
        src={src}
        className="w-full h-full object-cover"
        alt="MJPEG Stream"
        onError={() => {
          if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE);
        }}
      />
    </div>
  );
};

/* ---------------- JSMpeg Player ---------------- */
const JSMpegPlayer = ({ streamUrl, id, customClass }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;

    const setupPlayer = () => {
      if (!containerRef.current || !streamUrl || !window.JSMpeg) {
        setHasError(true);
        return;
      }

      setHasError(false);

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }

      const oldCanvas = containerRef.current.querySelector("canvas");
      if (oldCanvas) oldCanvas.remove();

      canvas = document.createElement("canvas");
      canvas.id = id.toString();
      canvas.className = "m-0 w-full h-full";
      containerRef.current.appendChild(canvas);

      try {
        playerRef.current = new window.JSMpeg.Player(streamUrl, {
          canvas,
          progressive: true,
          onSourceError: () => setHasError(true),
        });
      } 
      catch (error) {
        console.error("JSMpeg error:", error);
        setHasError(true);
      }
    };

    setupPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      if (canvas) canvas.remove();
    };
  }, [streamUrl, id]);

  if (hasError) {
    return (
      <img
        src={FALLBACK_IMAGE}
        className={`w-full h-full object-cover ${customClass || ""}`}
        alt="No Video"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex py-[0.3rem] px-[1rem] ${customClass || ""}`}
    />
  );
};

export const VideoPlayer = (props: VideoPlayerProps) => {
  return props.isMjpeg ? (
    <MjpegPlayer {...props} />
  ) : (
    <JSMpegPlayer {...props} />
  );
};

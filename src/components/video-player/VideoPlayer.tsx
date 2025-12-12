import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  streamUrl: string | null;
  id: number;
  customClass?: string;
  isMjpeg?: boolean;
}

/* ---------------- MJPEG Player ---------------- */
const MjpegPlayer = ({ streamUrl, customClass }: VideoPlayerProps) => {
  return (
    <img
      src={streamUrl || ""}
      className={`w-full h-full object-cover ${customClass || ""}`}
      alt="MJPEG Stream"
    />
  );
};

/* ---------------- JSMpeg Player ---------------- */
const JSMpegPlayer = ({ streamUrl, id, customClass }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;

    const setupPlayer = () => {
      if (!containerRef.current || !streamUrl) return;

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
        if (window.JSMpeg) {
          playerRef.current = new window.JSMpeg.Player(streamUrl, {
            canvas,
            progressive: true,
          });
        }
      } catch (error) {
        console.error("JSMpeg error:", error);
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

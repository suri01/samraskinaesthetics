"use client";

import { useEffect, useRef, useState } from "react";

type Facing = "user" | "environment";
type Stage = "before" | "front" | "left" | "right" | "other";

type CapturedPhoto = {
  id: string;
  previewUrl: string;
  stage: Stage;
  byteSize: number;
};

type ImageCaptureLike = {
  takePhoto: (photoSettings?: Record<string, number>) => Promise<Blob>;
  getPhotoCapabilities?: () => Promise<{
    imageWidth?: { min: number; max: number };
    imageHeight?: { min: number; max: number };
  }>;
};

const STAGES: Array<{ value: Stage; label: string }> = [
  { value: "front", label: "Front" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "before", label: "Before" },
  { value: "other", label: "Other" },
];

function getImageCapture(track: MediaStreamTrack): ImageCaptureLike | null {
  const Ctor = (window as unknown as {
    ImageCapture?: new (track: MediaStreamTrack) => ImageCaptureLike;
  }).ImageCapture;
  if (!Ctor) return null;
  try {
    return new Ctor(track);
  } catch {
    return null;
  }
}

async function blobFromVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error("Camera not ready");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas");
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 1),
  );
  if (!blob) throw new Error("Could not encode photo");
  return blob;
}

async function captureHighestQuality(stream: MediaStream, video: HTMLVideoElement): Promise<Blob> {
  const track = stream.getVideoTracks()[0];
  if (track) {
    const imageCapture = getImageCapture(track);
    if (imageCapture) {
      try {
        if (typeof imageCapture.getPhotoCapabilities === "function") {
          const caps = await imageCapture.getPhotoCapabilities();
          const settings: Record<string, number> = {};
          if (caps.imageWidth?.max) settings.imageWidth = caps.imageWidth.max;
          if (caps.imageHeight?.max) settings.imageHeight = caps.imageHeight.max;
          return await imageCapture.takePhoto(settings);
        }
        return await imageCapture.takePhoto();
      } catch {
        // iOS Safari often lacks full ImageCapture — fall through.
      }
    }
  }
  return blobFromVideoFrame(video);
}

export function IpadCameraCapture(props: {
  onCountChange?: (count: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef<CapturedPhoto[]>([]);

  const [facing, setFacing] = useState<Facing>("user");
  const [stage, setStage] = useState<Stage>("front");
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [resolution, setResolution] = useState<string | null>(null);

  useEffect(() => {
    photosRef.current = photos;
    props.onCountChange?.(photos.length);
  }, [photos, props]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      for (const p of photosRef.current) URL.revokeObjectURL(p.previewUrl);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
    setResolution(null);
  }

  async function startCamera(nextFacing: Facing = facing) {
    setError(null);
    setStatus(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      setLive(true);
      setFacing(nextFacing);

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() ?? {};
      if (settings.width && settings.height) {
        setResolution(`${settings.width}×${settings.height}`);
      }

      try {
        await track?.applyConstraints({
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        });
        const after = track?.getSettings?.() ?? {};
        if (after.width && after.height) {
          setResolution(`${after.width}×${after.height}`);
        }
      } catch {
        /* ignore unsupported constraints */
      }
    } catch {
      setError(
        "Camera access was blocked or unavailable. Use “Device camera (full quality)” below, or allow camera permission for this site.",
      );
      setLive(false);
    }
  }

  async function uploadBlob(blob: Blob, source: string) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
      const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const file = new File([blob], `ipad-${stage}-${Date.now()}.${ext}`, { type });
      const body = new FormData();
      body.set("file", file);
      body.set("stage", stage);
      body.set("caption", `iPad ${source} · ${stage}`);

      const res = await fetch("/api/ipad/photos", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const previewUrl = URL.createObjectURL(blob);
      setPhotos((prev) => [
        ...prev,
        {
          id: String(data.id),
          previewUrl,
          stage,
          byteSize: Number(data.byteSize ?? blob.size),
        },
      ]);
      setStatus(`Saved ${stage} photo (${Math.round((data.byteSize ?? blob.size) / 1024)} KB).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function captureLive() {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) {
      setError("Start the camera first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await captureHighestQuality(stream, video);
      await uploadBlob(blob, "live");
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Capture failed");
    }
  }

  async function onNativeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadBlob(file, "device-camera");
  }

  async function flipCamera() {
    await startCamera(facing === "user" ? "environment" : "user");
  }

  return (
    <div className="stack ipad-camera">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Photos</h2>
        {resolution ? (
          <span className="badge badge--mock">{resolution}</span>
        ) : (
          <span className="badge badge--gold">Highest quality</span>
        )}
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Capture photos for this appointment only. Live capture uses max available resolution and
        JPEG quality 1.0; “Device camera” opens the iPad camera app for a full-resolution still.
      </p>

      <div className="field">
        <label htmlFor="photo-stage">Photo type</label>
        <select
          id="photo-stage"
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ipad-camera__viewport">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={live ? "ipad-camera__video" : "ipad-camera__video ipad-camera__video--idle"}
        />
        {!live ? (
          <div className="ipad-camera__placeholder">
            <p>Camera preview</p>
          </div>
        ) : null}
      </div>

      <div className="row">
        {!live ? (
          <button className="btn btn--primary" type="button" onClick={() => startCamera()} disabled={busy}>
            Start camera
          </button>
        ) : (
          <>
            <button className="btn btn--gold" type="button" onClick={captureLive} disabled={busy}>
              {busy ? "Saving…" : "Capture photo"}
            </button>
            <button className="btn btn--ghost" type="button" onClick={flipCamera} disabled={busy}>
              Flip camera
            </button>
            <button className="btn btn--ghost" type="button" onClick={stopStream} disabled={busy}>
              Stop
            </button>
          </>
        )}
        <button
          className="btn btn--ghost"
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Device camera (full quality)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture={facing === "environment" ? "environment" : "user"}
          className="sr-only"
          onChange={onNativeFile}
        />
      </div>

      {status ? <p className="ok">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {photos.length > 0 ? (
        <div className="ipad-camera__thumbs">
          {photos.map((p) => (
            <figure key={p.id} className="ipad-camera__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt={`${p.stage} capture`} />
              <figcaption>
                {p.stage} · {Math.round(p.byteSize / 1024)} KB
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

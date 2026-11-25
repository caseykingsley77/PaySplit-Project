'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {Camera,CameraOff,CheckCircle2,RefreshCw,ShieldCheck} from 'lucide-react';

type Props={
  busy:boolean;
  approved:boolean;
  onOpenVerification:()=>void;
  onCheckStatus:()=>void;
};

type CameraState='starting'|'ready'|'unavailable';

/**
 * The camera view is an on-device framing preview, not a biometric liveness
 * detector. No photographs are uploaded, persisted, or passed to PaySplit.
 * Actual KYC is completed by the trusted identity provider.
 */
export default function LivenessCamera({busy,approved,onOpenVerification,onCheckStatus}:Props){
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const [cameraState,setCameraState]=useState<CameraState>('starting');
 const [cameraError,setCameraError]=useState('');
 const [captured,setCaptured]=useState(false);

 const release=useCallback(()=>{
   streamRef.current?.getTracks().forEach(track=>track.stop());
   streamRef.current=null;
   if(videoRef.current)videoRef.current.srcObject=null;
 },[]);

 const start=useCallback(async()=>{
   release();
   setCaptured(false);
   setCameraState('starting');
   setCameraError('');

   if(!navigator.mediaDevices?.getUserMedia){
     setCameraState('unavailable');
     setCameraError('This browser cannot access a camera. You can still continue with secure identity verification.');
     return;
   }

   try{
     const stream=await navigator.mediaDevices.getUserMedia({
       audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}
     });
     if(!videoRef.current){
       stream.getTracks().forEach(track=>track.stop());
       return;
     }
     streamRef.current=stream;
     videoRef.current.srcObject=stream;
     await videoRef.current.play();
     setCameraState('ready');
   }catch(error){
     release();
     const name=error instanceof DOMException?error.name:'';
     const message=name==='NotAllowedError'||name==='PermissionDeniedError'
       ?'Camera access was blocked. Allow camera permission in your browser, then try again.'
       :name==='NotFoundError'||name==='DevicesNotFoundError'
       ?'No camera was detected on this device.'
       :'We could not start your camera. Check your device settings and try again.';
     setCameraState('unavailable');
     setCameraError(message);
   }
 },[release]);

 useEffect(()=>{
   let active=true;
   const startOnMount=async()=>{if(active)await start();};
   void startOnMount();
   return()=>{active=false;release();};
 },[start,release]);

 function takeShot(){
   const video=videoRef.current;
   const canvas=canvasRef.current;
   if(!video||!canvas||cameraState!=='ready'||video.videoWidth===0)return;
   // Keep only a temporary in-memory preview. Do not transmit or persist it.
   const width=video.videoWidth,height=video.videoHeight;
   canvas.width=width;
   canvas.height=height;
   const context=canvas.getContext('2d');
   if(!context)return;
   context.save();
   context.translate(width,0);
   context.scale(-1,1);
   context.drawImage(video,0,0,width,height);
   context.restore();
   release();
   setCaptured(true);
 }

 return <div className="ps-live-verification">
   <h2>Biometric Liveness Verification</h2>
   <p className="ps-liveness-intro">Ensure you are in good lighting. Look directly into the camera frame.</p>

   <div className="ps-face-frame" aria-label="Camera framing preview">
     <video ref={videoRef} className="ps-face-video" autoPlay playsInline muted
       style={{display:cameraState==='ready'&&!captured?'block':'none'}}/>
     <canvas ref={canvasRef} className="ps-face-capture" aria-label="Captured photograph preview"
       style={{display:captured?'block':'none'}}/>
     {cameraState!=='ready'&&!captured&&<div className="ps-face-camera-status">
       {cameraState==='starting'?<><Camera size={36}/><span>Starting camera…</span></>:<><CameraOff size={36}/><span>{cameraError}</span><button type="button" className="ps-outline-btn" onClick={()=>void start()}><RefreshCw size={14}/> Try camera again</button></>}
     </div>}
     {(cameraState==='ready'||captured)&&<div className="ps-face-oval" aria-hidden="true"/>}
   </div>
   <small className="ps-face-caption">Position your face inside the oval</small>
   {!captured?<button type="button" className="ps-blue-btn ps-liveness-snapshot" onClick={takeShot}
       disabled={cameraState!=='ready'||busy}><Camera size={16}/> Take shot</button>:
     <button type="button" className="ps-outline-btn ps-liveness-snapshot" onClick={()=>void start()} disabled={busy}><RefreshCw size={16}/> Retake photo</button>}
   <p className="ps-liveness-privacy"><ShieldCheck size={16}/> Camera previews stay on this device and are not uploaded. A photo alone does not verify liveness.</p>
   <div className="ps-liveness-actions">
     <button type="button" className="ps-outline-btn" disabled={busy} onClick={onOpenVerification}>Open secure verification</button>
     <button type="button" className="ps-blue-btn" disabled={busy} onClick={onCheckStatus}>{busy?'Checking…':'Check verification status'}</button>
   </div>
   {approved&&<div className="ps-liveness-approved"><CheckCircle2 size={18}/> Identity and liveness verified by the provider.</div>}
 </div>;
}

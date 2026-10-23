/** Desktop wave adapter. Integration code: staging validation still required.
 * Existing Chromium/Firefox WebM assets remain unchanged; supply their URL.
 * Never place src/poster/preload markup outside this controller on mobile.
 */
export const VERTEX_SHADER = 'attribute vec2 p; varying vec2 uv; void main(){gl_Position=vec4(p,0.0,1.0);uv=vec2((p.x+1.0)*0.5,(1.0-p.y)*0.5);}';
export const FRAGMENT_SHADER = 'precision highp float; varying vec2 uv; uniform sampler2D uPackedVideo; void main(){float py=uv.y*2230.0; if(py<400.0||py>=1648.0){gl_FragColor=vec4(0.0);return;} vec2 q=clamp(vec2(uv.x,(py-400.0)/1248.0),vec2(0.5/4096.0,0.5/1248.0),vec2(1.0-0.5/4096.0,1.0-0.5/1248.0)); vec3 rgb=texture2D(uPackedVideo,vec2(q.x,q.y*0.5)).rgb;float a=clamp(texture2D(uPackedVideo,vec2(q.x,0.5+q.y*0.5)).r,0.0,1.0);gl_FragColor=vec4(rgb*a,a);}';

export function mountDesktopWaves(host, {
  safariMp4, posterUrl, webmUrl,
  // Explicit route can override detection; never probe by downloading both clips.
  route = /Safari\//.test(navigator.userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR|FxiOS)\//.test(navigator.userAgent) ? 'safari' : 'webm',
  onStatus = () => {},
} = {}) {
  if (!host || !safariMp4 || !posterUrl) throw new Error('host, safariMp4 and posterUrl are required');
  if (!['safari', 'webm'].includes(route)) throw new Error('Unknown wave route');
  const desktop = matchMedia('(min-width: 681px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  Object.assign(layer.style, {position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});
  layer.setAttribute('aria-hidden','true'); host.append(layer);
  // Host owns the exact existing wave image rectangle/transform. Never resize the hero here.
  let poster, video, canvas, gl, program, texture, buffer, shaders=[];
  let callback=null, callbackKind=null, visible=false, destroyed=false, failed=false, epoch=0, starting=false, rendered=0;
  const status = message => { try { onStatus({message,route,rendered}); } catch (_) {} };
  const fit = element => Object.assign(element.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
  const eligible = () => !destroyed && desktop.matches && !reduced.matches && visible && !document.hidden && !failed;
  function ensurePoster() {
    if (!desktop.matches || destroyed || poster) return;
    poster=document.createElement('img'); poster.alt=''; poster.decoding='async'; fit(poster);
    poster.src=posterUrl; layer.append(poster);
  }
  function cancel() {
    if(callback!==null && video) {
      if(callbackKind==='video') video.cancelVideoFrameCallback(callback);
      else cancelAnimationFrame(callback);
    }
    callback=null; callbackKind=null;
  }
  function pause() { epoch++; starting=false; cancel(); if(video) video.pause(); }
  function showPoster() {
    ensurePoster(); if(poster) poster.style.visibility='visible';
    if(canvas) canvas.style.visibility='hidden';
    if(video) video.style.visibility='hidden';
  }
  function releaseMedia() {
    pause();
    if(video) { video.removeAttribute('src'); video.load(); video.remove(); video=null; }
    if(gl) {
      if(texture) gl.deleteTexture(texture); if(buffer) gl.deleteBuffer(buffer);
      if(program) gl.deleteProgram(program); for(const s of shaders) gl.deleteShader(s);
    }
    if(canvas) { canvas.width=1;canvas.height=1;canvas.remove(); }
    canvas=gl=texture=program=buffer=null; shaders=[];
  }
  function fail(message) { failed=true; releaseMedia(); showPoster(); status(message+'; static poster retained'); }
  function initGL() {
    canvas=document.createElement('canvas'); canvas.width=4096; canvas.height=2230;fit(canvas);canvas.style.visibility='hidden';layer.append(canvas);
    canvas.addEventListener('webglcontextlost', event => {event.preventDefault();fail('WebGL context lost');});
    gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
    if(!gl) throw new Error('WebGL unavailable');
    if(gl.getParameter(gl.MAX_TEXTURE_SIZE)<4096 || gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)<4096) throw new Error('GPU size limit below native 4096; no silent downscale');
    function compile(type,source) {const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX_SHADER));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT_SHADER));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.uniform1i(gl.getUniformLocation(program,'uPackedVideo'),0);gl.disable(gl.BLEND);gl.viewport(0,0,4096,2230);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  }
  function schedule() {
    if(!eligible() || !video || video.paused || callback!==null) return;
    if('requestVideoFrameCallback' in video) {callbackKind='video'; callback=video.requestVideoFrameCallback(draw);}
    else {callbackKind='raf';callback=requestAnimationFrame(draw);}
  }
  function draw() {
    callback=null;callbackKind=null;if(!eligible() || !video || video.paused)return;
    try {
      if(video.readyState>=2) {
        if(route==='safari') {
          if(video.videoWidth!==4096 || video.videoHeight!==2496) throw new Error('Unexpected packed video dimensions');
          gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
          const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('WebGL error '+error);canvas.style.visibility='visible';
        } else video.style.visibility='visible';
        // Only one visible image: never overlay translucent video on the poster.
        if(poster)poster.style.visibility='hidden'; rendered++;
      }
      schedule();
    } catch(error) {fail(error.message);}
  }
  async function start() {
    if(!eligible() || starting) return;
    if(video && !video.paused) {schedule();return;}
    const token=epoch; starting=true;
    try {
      if(!video) {
        if(route==='webm' && !webmUrl)throw new Error('Existing WebM URL not supplied');
        if(route==='safari')initGL();
        video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;video.preload='none';video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');
        fit(video);video.style.visibility='hidden';
        if(route==='safari')Object.assign(video.style,{width:'1px',height:'1px',opacity:'0'});
        layer.append(video);
        const target=video;
        target.addEventListener('error',()=>{if(target===video && !destroyed)fail('Video decoder/load error '+(target.error?.message||target.error?.code||''));});
        // Use same-origin URLs. For approved cross-origin CDN set CORS correctly before src.
        video.src=route==='safari'?safariMp4:webmUrl;video.load();
      }
      const target=video;await target.play();
      if(token!==epoch)return;
      if(!eligible() || target!==video) {target.pause();return;}
      status('Playing');schedule();
    } catch(error) {if(token===epoch && !destroyed)fail('Playback/autoplay failed: '+error.message);}
    finally {if(token===epoch)starting=false;}
  }
  function reconcile() {
    if(destroyed)return;
    if(!desktop.matches) {
      releaseMedia(); if(poster){poster.removeAttribute('src');poster.remove();poster=null;}
      layer.style.display='none';failed=false;status('Mobile: no wave asset sources');return;
    }
    layer.style.display='block';ensurePoster();
    if(reduced.matches) {releaseMedia();showPoster();status('Reduced motion: desktop poster only');return;}
    if(!visible || document.hidden) {pause();return;}
    start();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);reconcile();},{threshold:0});observer.observe(host);
  desktop.addEventListener('change',reconcile);reduced.addEventListener('change',reconcile);document.addEventListener('visibilitychange',reconcile);
  reconcile();
  return {
    // Useful for staging diagnostics; no data leaves the browser.
    diagnostics() {const r=host.getBoundingClientRect();return {route,rendered,desktop:desktop.matches,reducedMotion:reduced.matches,visible,failed,cssWidth:r.width,dpr:devicePixelRatio,requiredWidth:Math.ceil(r.width*devicePixelRatio),nativeWidth:4096,videoWidth:video?.videoWidth,videoHeight:video?.videoHeight,playbackQuality:video?.getVideoPlaybackQuality?.()};},
    destroy() {if(destroyed)return;destroyed=true;observer.disconnect();desktop.removeEventListener('change',reconcile);reduced.removeEventListener('change',reconcile);document.removeEventListener('visibilitychange',reconcile);releaseMedia();if(poster){poster.removeAttribute('src');poster.remove();poster=null;}layer.remove();},
  };
}

/* TrustworkX-Einbau: Wellenebene im Header (nur Desktop > 680 px).
   Chrome/Edge/Firefox: bestehendes WebM; Safari: gepacktes MP4 über den Shader oben.
   Standbild: bestehende Desktop-Standbilder passend zur Bildbreite × DPR. Datensparmodus: nur Standbild. */
(() => {
  const host = document.querySelector('.hero-waves-box');
  if (!host) return;
  const desktop = matchMedia('(min-width: 681px)');
  const base = '/assets/header/';
  let mounted = false;
  function mount() {
    if (mounted || !desktop.matches) return;
    mounted = true;
    const need = host.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    const still = [1700, 2560, 4096, 5120].find(n => n >= need) || 5120;
    const posterUrl = base + 'header-waves-desktop-' + still + '.webp';
    if (navigator.connection && navigator.connection.saveData) {
      const img = document.createElement('img');
      img.alt = ''; img.decoding = 'async'; img.src = posterUrl;
      Object.assign(img.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' });
      host.append(img);
      return;
    }
    window.trustworkxWaves = mountDesktopWaves(host, {
      safariMp4: base + 'wellen-safari-packed-4096.mp4',
      posterUrl,
      webmUrl: base + 'wellen-desktop-' + (need <= 2560 ? '2560' : '4096') + '.webm',
    });
  }
  if (desktop.addEventListener) desktop.addEventListener('change', mount);
  mount();
})();

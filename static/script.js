document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Element Cache
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const mediaContainer = document.getElementById("mediaContainer");
  const sortDropdown = document.getElementById("sortDropdown");
  const resultsGrid = document.getElementById("resultsGrid");
  const resultsSection = document.getElementById("resultsSection");
  const resultsCount = document.getElementById("resultsCount");
  const assistantInsights = document.getElementById("assistantInsights");
  const loadingSection = document.getElementById("loadingSection");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingSubtitle = document.getElementById("loadingSubtitle");
  const loadingPercentage = document.getElementById("loadingPercentage");
  const loadingBarFill = document.getElementById("loadingBarFill");
  const imagePreview = document.getElementById("imagePreview");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraStreamWrapper = document.getElementById("cameraStreamWrapper");
  const cameraStatus = document.getElementById("cameraStatus");

  // Media States Elements
  const stateUpload = document.getElementById("state-upload");
  const stateCamera = document.getElementById("state-camera");
  const statePreview = document.getElementById("state-preview");

  // Interactive Buttons
  const btnLivePhoto = document.getElementById("btnLivePhoto");
  const btnCancelCamera = document.getElementById("btnCancelCamera");
  const btnShutter = document.getElementById("btnShutter");
  const btnRetake = document.getElementById("btnRetake");
  const btnSubmitMatch = document.getElementById("btnSubmitMatch");
  const btnSwitchCamera = document.getElementById("btnSwitchCamera");
  const btnToggleFlash = document.getElementById("btnToggleFlash");
  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const cameraZoomRange = document.getElementById("cameraZoomRange");
  const cameraZoomValue = document.getElementById("cameraZoomValue");

  // Application State
  let currentResults = [];
  let currentAssistantData = null;
  let capturedBlob = null;
  let activeStream = null;
  let activePreviewUrl = null;
  let currentFacingMode = "user";
  let currentZoom = 1;
  let isTorchOn = false;
  let pinchState = null;
  let lastMediaMode = "upload";
  let availableCameraCount = 0;
  let tapFocusSupported = false;

  function setCameraViewVisible() {
    stateUpload.classList.remove("active");
    statePreview.classList.remove("active");
    stateCamera.classList.add("active");
  }

  function updateRetakeButtonLabel() {
    if (!btnRetake) return;
    const label = lastMediaMode === "camera" ? "Retake Photo" : "Change Image";
    btnRetake.innerHTML = `<i data-lucide="rotate-ccw"></i> ${label}`;
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  // Favorites DOM Cache
  const favoritesSection = document.getElementById("favoritesSection");
  const favoritesGrid = document.getElementById("favoritesGrid");
  const favoritesCount = document.getElementById("favoritesCount");

  // --- STATE SWITCHER UTILITIES ---
  function showState(state) {
    // Deactivate all states first
    stateUpload.classList.remove("active");
    stateCamera.classList.remove("active");
    statePreview.classList.remove("active");

    if (state === "upload") {
      stateUpload.classList.add("active");
      stopCameraStream();
      capturedBlob = null;
      fileInput.value = "";
      btnSubmitMatch.disabled = true;
      setCameraStatus("");
      updateRetakeButtonLabel();
    } else if (state === "camera") {
      stateCamera.classList.add("active");
      capturedBlob = null;
      btnSubmitMatch.disabled = true;
      cameraVideo.style.transform = currentFacingMode === "user" ? "scaleX(-1)" : "none";
      updateRetakeButtonLabel();
    } else if (state === "preview") {
      statePreview.classList.add("active");
      stopCameraStream();
      btnSubmitMatch.disabled = false;
      setCameraStatus("");
      updateRetakeButtonLabel();
    }
  }

  function setCameraStatus(message, isError = false) {
    if (!cameraStatus) return;
    cameraStatus.textContent = message || "Live preview ready";
    cameraStatus.classList.toggle("error", Boolean(isError));
  }

  function releasePreviewUrl() {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      activePreviewUrl = null;
    }
  }

  function updateZoomUI() {
    currentZoom = Math.max(1, Math.min(4, Number(currentZoom) || 1));
    if (cameraZoomRange) {
      cameraZoomRange.value = currentZoom.toFixed(1);
    }
    if (cameraZoomValue) {
      cameraZoomValue.textContent = `${Number(currentZoom).toFixed(1)}x`;
    }
  }

  async function setVideoZoom(zoomValue) {
    if (!activeStream) return;
    const track = activeStream.getVideoTracks()[0];
    if (!track?.applyConstraints) return;
    try {
      await track.applyConstraints({
        advanced: [{ zoom: Number(zoomValue) || 1 }]
      });
    } catch (zoomErr) {
      console.warn("Zoom not supported by this camera track:", zoomErr);
    }
  }

  async function setTorchEnabled(enabled) {
    if (!activeStream) return false;
    const track = activeStream.getVideoTracks()[0];
    if (!track?.applyConstraints) return false;
    try {
      await track.applyConstraints({
        advanced: [{ torch: Boolean(enabled) }]
      });
      return true;
    } catch (torchErr) {
      console.warn("Torch is not available for this camera track:", torchErr);
      return false;
    }
  }

  async function stopActiveCameraTrack() {
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }
    if (cameraVideo) {
      cameraVideo.pause();
      cameraVideo.srcObject = null;
    }
    pinchState = null;
  }

  async function startCameraStream(requestedFacingMode = currentFacingMode) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("Camera access is not supported in this browser.", true);
      showState("upload");
      return;
    }

    try {
      setCameraViewVisible();
      setCameraStatus("Requesting camera access…");
      await stopActiveCameraTrack();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: requestedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      activeStream = stream;
      currentFacingMode = requestedFacingMode;
      cameraVideo.srcObject = activeStream;
      cameraVideo.muted = true;
      await cameraVideo.play().catch(() => {});
      cameraVideo.style.transform = currentFacingMode === "user" ? "scaleX(-1)" : "none";
      updateZoomUI();
      await setVideoZoom(currentZoom);

      const track = activeStream.getVideoTracks()[0];
      const capability = track?.getCapabilities?.();
      const torchSupported = Boolean(capability?.torch);
      const facingOptions = track?.getSettings?.();
      availableCameraCount = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput").length;
      btnSwitchCamera.disabled = availableCameraCount <= 1;
      btnSwitchCamera.classList.toggle("disabled", availableCameraCount <= 1);
      btnToggleFlash.disabled = !torchSupported;
      btnToggleFlash.classList.toggle("disabled", !torchSupported);
      if (!torchSupported) {
        isTorchOn = false;
        btnToggleFlash.classList.remove("active");
      }

      tapFocusSupported = Boolean(track?.applyConstraints && typeof track.getCapabilities === "function");
      if (facingOptions?.facingMode) {
        cameraVideo.setAttribute("data-facing-mode", facingOptions.facingMode);
      }

      setCameraStatus("Live preview ready");
    } catch (err) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraStatus("Camera permission was denied. Please allow access or upload an image instead.", true);
      } else {
        setCameraStatus("Camera access was denied or unavailable. Please upload an image instead.", true);
      }
      showState("upload");
    }
  }

  function stopCameraStream() {
    stopActiveCameraTrack();
  }

  function getTouchDistance(touches) {
    if (touches.length < 2) return 0;
    const [first, second] = touches;
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    return Math.hypot(dx, dy);
  }

  function handlePinchStart(event) {
    if (!activeStream || event.touches.length < 2) return;
    pinchState = {
      startDistance: getTouchDistance(event.touches),
      startZoom: currentZoom
    };
  }

  function handlePinchMove(event) {
    if (!pinchState || event.touches.length < 2) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches);
    const ratio = distance / pinchState.startDistance;
    currentZoom = Math.max(1, Math.min(4, pinchState.startZoom * ratio));
    updateZoomUI();
    setVideoZoom(currentZoom);
  }

  function handleTapToFocus(event) {
    if (!activeStream || !tapFocusSupported || !cameraVideo.videoWidth || !cameraVideo.videoHeight) return;
    const rect = cameraVideo.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * cameraVideo.videoWidth;
    const y = ((event.clientY - rect.top) / rect.height) * cameraVideo.videoHeight;
    const track = activeStream.getVideoTracks()[0];
    if (!track?.applyConstraints) return;
    const focusPoint = {
      x: x / cameraVideo.videoWidth,
      y: y / cameraVideo.videoHeight
    };
    track.applyConstraints({
      advanced: [{ focusMode: "auto", pointsOfInterest: [{ x: focusPoint.x, y: focusPoint.y, weight: 1 }] }]
    }).catch(() => {});
  }

  if (cameraStreamWrapper) {
    cameraStreamWrapper.addEventListener("touchstart", handlePinchStart, { passive: false });
    cameraStreamWrapper.addEventListener("touchmove", handlePinchMove, { passive: false });
    cameraStreamWrapper.addEventListener("touchend", () => {
      pinchState = null;
    });
    cameraStreamWrapper.addEventListener("click", handleTapToFocus);
  }

  // --- DRAG AND DROP HANDLERS ---
  // Highlight dropzone on dragover
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = "rgba(244, 63, 94, 0.05)";
      dropZone.style.borderColor = "var(--color-primary)";
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = "";
      dropZone.style.borderColor = "";
    }, false);
  });

  // Handle dropped files
  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleSelectedFile(files[0]);
    }
  });

  // Handle click on dropzone to choose file
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle selected file
  fileInput.addEventListener("change", (e) => {
    if (fileInput.files.length > 0) {
      handleSelectedFile(fileInput.files[0]);
    }
  });

  function handleSelectedFile(file) {
    if (!file.type.startsWith("image/")) {
      try {
        alert("Please select a valid image file.");
      } catch (alertErr) {
        console.error("Alert blocked by sandbox:", alertErr);
      }
      return;
    }
    capturedBlob = null; // Clear any active captured image
    lastMediaMode = "upload";
    const reader = new FileReader();
    reader.onload = (e) => {
      releasePreviewUrl();
      imagePreview.src = e.target.result;
      showState("preview");
    };
    reader.readAsDataURL(file);
  }

  // --- INTERACTIVE ACTIONS ---

  // Live photo click
  btnLivePhoto.addEventListener("click", () => {
    lastMediaMode = "camera";
    startCameraStream(currentFacingMode);
  });

  // Cancel camera click
  btnCancelCamera.addEventListener("click", () => {
    showState("upload");
  });

  // Switch camera
  btnSwitchCamera.addEventListener("click", async () => {
    if (availableCameraCount <= 1) return;
    const nextFacingMode = currentFacingMode === "user" ? "environment" : "user";
    await startCameraStream(nextFacingMode);
  });

  // Toggle flash/torch
  btnToggleFlash.addEventListener("click", async () => {
    if (!activeStream) return;
    isTorchOn = !isTorchOn;
    const applied = await setTorchEnabled(isTorchOn);
    if (!applied) {
      isTorchOn = false;
      btnToggleFlash.classList.remove("active");
      setCameraStatus("Flash is not available on this device.", true);
      return;
    }
    btnToggleFlash.classList.toggle("active", isTorchOn);
    setCameraStatus(isTorchOn ? "Flash is on." : "Flash is off.");
  });

  // Zoom controls
  btnZoomIn.addEventListener("click", async () => {
    currentZoom = Math.min(4, currentZoom + 0.5);
    updateZoomUI();
    await setVideoZoom(currentZoom);
  });

  btnZoomOut.addEventListener("click", async () => {
    currentZoom = Math.max(1, currentZoom - 0.5);
    updateZoomUI();
    await setVideoZoom(currentZoom);
  });

  cameraZoomRange.addEventListener("input", async (event) => {
    currentZoom = Number(event.target.value);
    updateZoomUI();
    await setVideoZoom(currentZoom);
  });

  btnZoomIn.disabled = false;
  btnZoomOut.disabled = false;

  // Shutter trigger capture click
  btnShutter.addEventListener("click", async () => {
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return;

    const canvas = document.createElement("canvas");
    const maxDimension = 1600;
    const videoWidth = cameraVideo.videoWidth;
    const videoHeight = cameraVideo.videoHeight;
    const scale = Math.min(1, maxDimension / Math.max(videoWidth, videoHeight));
    canvas.width = Math.max(1, Math.round(videoWidth * scale));
    canvas.height = Math.max(1, Math.round(videoHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle horizontal mirror flip for natural selfie look
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9);
    });

    if (blob) {
      capturedBlob = blob;
      releasePreviewUrl();
      const previewUrl = URL.createObjectURL(blob);
      activePreviewUrl = previewUrl;
      imagePreview.src = previewUrl;
      showState("preview");
      setCameraStatus("Photo captured. Review and submit when ready.");
    }
  });

  // Change / Retake Click
  btnRetake.addEventListener("click", async () => {
    if (lastMediaMode === "camera") {
      await startCameraStream(currentFacingMode);
    } else {
      showState("upload");
    }
  });

  updateRetakeButtonLabel();

  // --- SUBMIT MATCH HANDLER ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Enter Loading State
    loadingSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    
    // Smooth scroll to loading section
    loadingSection.scrollIntoView({ behavior: "smooth", block: "center" });

    // Setup beautiful rotating beauty status messages
    const beautyStatuses = [
      { percentage: 0, title: "Scanning Facial Pixels", subtitle: "Analyzing image color space and skin surface depth..." },
      { percentage: 14, title: "Isolating Skin Tones", subtitle: "Detecting face bounding box and adjusting light glare..." },
      { percentage: 28, title: "Analyzing Shade Undertones", subtitle: "Extracting subtle warm, cool, and neutral pigmentation values..." },
      { percentage: 45, title: "Filtering Environmental Lighting", subtitle: "Normalizing white balance to direct studio-accurate lux..." },
      { percentage: 62, title: "Calibrating Custom Formulas", subtitle: "Cross-matching color values with luxury shade databases..." },
      { percentage: 78, title: "Ranking Formula Matches", subtitle: "Sorting by perfect-match index and price tier preferences..." },
      { percentage: 91, title: "Refining Luxury Palette", subtitle: "Finalizing optimal brand alignments and swatch mappings..." }
    ];

    // Initialize progress variables
    let currentProgress = 0;
    let fetchCompleted = false;
    let matchData = null;
    let fetchError = null;
    let requestSettled = false;

    // Reset loader UI to starting values
    loadingPercentage.innerText = "0%";
    loadingBarFill.style.width = "0%";
    loadingTitle.innerText = beautyStatuses[0].title;
    loadingSubtitle.innerText = beautyStatuses[0].subtitle;

    function finalizeRequest() {
      if (requestSettled) return;
      requestSettled = true;
      fetchCompleted = true;
      clearInterval(progressInterval);
      currentProgress = 100;
      loadingPercentage.innerText = "100%";
      loadingBarFill.style.width = "100%";

      if (fetchError) {
        handleMatchFailure(fetchError);
      } else if (matchData) {
        currentResults = matchData.matches || [];
        currentAssistantData = matchData.assistant || null;
        updateResultsView();

        loadingSection.classList.add("hidden");
        resultsSection.classList.remove("hidden");
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        handleMatchFailure(new Error("No match data was returned by the server."));
      }
    }

    const progressInterval = setInterval(() => {
      if (fetchCompleted && !fetchError) {
        currentProgress += Math.max(3, Math.floor((100 - currentProgress) / 4));
      } else {
        if (currentProgress < 30) {
          currentProgress += Math.random() * 1.8 + 0.8;
        } else if (currentProgress < 60) {
          currentProgress += Math.random() * 1.1 + 0.4;
        } else if (currentProgress < 85) {
          currentProgress += Math.random() * 0.7 + 0.2;
        } else if (currentProgress < 98) {
          currentProgress += Math.random() * 0.3 + 0.08;
        }
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        finalizeRequest();
        return;
      } else if (currentProgress > 98 && !fetchCompleted) {
        currentProgress = 98;
      }

      const roundedProgress = Math.floor(currentProgress);
      loadingPercentage.innerText = `${roundedProgress}%`;
      loadingBarFill.style.width = `${roundedProgress}%`;

      let activeStatus = beautyStatuses[0];
      for (const status of beautyStatuses) {
        if (roundedProgress >= status.percentage) {
          activeStatus = status;
        }
      }

      if (loadingTitle.innerText !== activeStatus.title) {
        loadingTitle.innerText = activeStatus.title;
        loadingSubtitle.innerText = activeStatus.subtitle;
      }
    }, 35);

    function handleMatchFailure(err) {
      const message = err?.message || "Something went wrong while matching your shades.";
      console.error("[frontend] matching error", err);
      loadingTitle.innerText = "We couldn't complete the match";
      loadingSubtitle.innerText = message;
      loadingPercentage.innerText = "0%";
      loadingBarFill.style.width = "0%";
      loadingSection.classList.remove("hidden");
      resultsSection.classList.add("hidden");
    }

    try {
      console.log("[frontend] upload started");
      const formData = new FormData();

      if (capturedBlob) {
        formData.append("image", capturedBlob, "captured-selfie.jpg");
      } else if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
      } else {
        throw new Error("No image selected. Please upload or take a live photo.");
      }

      console.log("[frontend] request sent");
      fetch("/match", {
        method: "POST",
        body: formData
      })
      .then(async (res) => {
        console.log("[frontend] response received", { status: res.status });
        if (!res.ok) {
          let payload = null;
          try {
            payload = await res.json();
          } catch (parseErr) {
            console.warn("[frontend] could not parse error payload", parseErr);
          }
          const message = payload?.error || payload?.message || `Server returned error status: ${res.status}`;
          throw new Error(message);
        }
        const data = await res.json();
        console.log("[frontend] success response parsed", { keys: Object.keys(data || {}) });
        matchData = data;
      })
      .catch((err) => {
        console.error("[frontend] error received", err);
        fetchError = err;
      })
      .finally(() => {
        console.log("[frontend] loading finished");
        finalizeRequest();
      });

    } catch (err) {
      console.error("[frontend] request setup failed", err);
      fetchError = err;
      finalizeRequest();
    }
  });

  // --- DISPLAY RESULTS ENGINE ---
  function renderAssistant(assistantData) {
    if (!assistantInsights) return;

    if (!assistantData) {
      assistantInsights.innerHTML = "";
      assistantInsights.classList.add("hidden");
      return;
    }

    const tone = assistantData.detectedSkinTone?.label || "Balanced tone";
    const undertone = assistantData.detectedUndertone?.label || "Neutral";
    const depth = assistantData.skinDepth?.label || "Medium";
    const brightness = assistantData.brightnessLevel?.label || "Balanced";
    const qualityScore = assistantData.imageQualityScore ?? 0;
    const confidence = assistantData.matchConfidence ?? 0;
    const explanation = assistantData.explanation || "Your image was analyzed to guide the best foundation recommendation.";
    const qualityIssue = assistantData.qualityIssue || "";
    const qualityTips = (assistantData.qualityTips || []).slice(0, 4);
    const recommendations = assistantData.recommendations || [];

    const recMarkup = recommendations.map((item) => {
      if (item.type === "similarShades") {
        const shades = (item.shades || []).slice(0, 3).map((shade) => `${shade.brand} · ${shade.name}`).join(" • ");
        return `<li><strong>${item.title}</strong><span>${shades || "More close matches available"}</span></li>`;
      }
      const shadeText = item.shade ? `${item.shade.brand} · ${item.shade.name}` : "—";
      return `<li><strong>${item.title}</strong><span>${shadeText}</span></li>`;
    }).join("");

    const qualityMarkup = qualityTips.length > 0
      ? qualityTips.map((tip) => `<li>${tip}</li>`).join("")
      : `<li>Image quality looks strong enough for a reliable match.</li>`;

    assistantInsights.innerHTML = `
      <div class="assistant-card">
        <div class="assistant-card-header">
          <div>
            <span class="assistant-pill">AI Beauty Assistant</span>
            <h3>Why this match was selected</h3>
          </div>
          <div class="assistant-score">${qualityScore}% clarity</div>
        </div>
        <p class="assistant-summary">${explanation}</p>
        <div class="assistant-grid">
          <div class="assistant-stat"><span>Estimated tone</span><strong>${tone}</strong></div>
          <div class="assistant-stat"><span>Undertone</span><strong>${undertone}</strong></div>
          <div class="assistant-stat"><span>Depth</span><strong>${depth}</strong></div>
          <div class="assistant-stat"><span>Brightness</span><strong>${brightness}</strong></div>
          <div class="assistant-stat"><span>Match confidence</span><strong>${confidence}%</strong></div>
        </div>
        ${qualityIssue ? `<div class="assistant-alert">${qualityIssue}</div>` : ""}
        <div class="assistant-recommendations">
          <div class="assistant-subsection">
            <h4>Recommended paths</h4>
            <ul>${recMarkup}</ul>
          </div>
          <div class="assistant-subsection">
            <h4>Image guidance</h4>
            <ul>${qualityMarkup}</ul>
          </div>
        </div>
      </div>
    `;
    assistantInsights.classList.remove("hidden");
  }

  function displayResults(results) {
    resultsGrid.innerHTML = "";
    renderAssistant(currentAssistantData);

    if (results.length === 0) {
      // Customize message if the filter resulted in 0 items
      const isFiltered = activePriceRange !== "all";
      resultsCount.innerText = isFiltered ? "No matches found under this filter" : "No matches found";
      resultsGrid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; padding: 48px; text-align: center;">
          <i data-lucide="help-circle" style="width: 48px; height: 48px; color: var(--color-primary); margin-bottom: 16px;"></i>
          <h3 style="font-family: var(--font-serif); font-size: 20px; margin-bottom: 8px;">${isFiltered ? "No Filter Matches" : "No Direct Matches Found"}</h3>
          <p style="color: var(--color-text-muted);">${isFiltered ? "Try selecting a different price tier or uploading a new image." : "Please try uploading another photo with different lighting conditions."}</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    // Update dynamic results count text
    let countText = `We found ${results.length} formula${results.length > 1 ? 's' : ''} calibrated to your shade`;
    if (activePriceRange === "affordable") {
      countText = `We found ${results.length} affordable formula${results.length > 1 ? 's' : ''} (< ₹1,000)`;
    } else if (activePriceRange === "luxury") {
      countText = `We found ${results.length} luxury formula${results.length > 1 ? 's' : ''} (₹1,000+)`;
    }
    resultsCount.innerText = countText;

    const favorites = JSON.parse(localStorage.getItem("foundation_favorites") || "[]");

    results.forEach((r) => {
      // Create Luxury cosmetic card
      const card = document.createElement("div");
      card.className = "shade-card";
      
      // Compute formatted accuracy badge
      const accuracyText = r.accuracy ? `${r.accuracy}% Match` : "98% Match";
      
      // Check if this shade is favorited
      const isFav = favorites.some(fav => fav.brand === r.brand && fav.name === r.name && (fav.shade || '') === (r.shade || ''));
      
      // Compute optional premium features
      let attributesHtml = "";
      if (r.spf || r.coverage || r.finish || r.undertone) {
        attributesHtml = `<div class="card-attributes" style="display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 12px 0;">`;
        if (r.spf) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">SPF ${r.spf}</span>`;
        }
        if (r.coverage) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.coverage}</span>`;
        }
        if (r.finish) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.finish}</span>`;
        }
        if (r.undertone) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.undertone}</span>`;
        }
        attributesHtml += `</div>`;
      }

      // Render luxury cosmetic card
      card.innerHTML = `
        <div class="match-badge-wrapper">
          <span class="match-badge">${accuracyText}</span>
        </div>
        <div class="favorite-btn-wrapper">
          <button class="btn-favorite ${isFav ? 'is-active' : ''}" data-brand="${r.brand}" data-name="${r.name}" data-shade="${r.shade || ''}" title="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
            <i data-lucide="heart" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="card-swatch-area">
          <div class="color-swatch-fluid" style="background: ${r.hex};">
            <div class="swatch-sheen"></div>
          </div>
          <button type="button" class="btn-ar-tryon-overlay" data-brand="${r.brand}" data-name="${r.name}" data-shade="${r.shade || ''}" data-hex="${r.hex}">
            <i data-lucide="camera" style="width: 13px; height: 13px; margin-right: 5px;"></i> AR Try-On
          </button>
        </div>
        <div class="card-info">
          <span class="card-brand">${r.brand || "Luxury Brand"}</span>
          <h3 class="card-title">${r.name || "Perfect Finish"}</h3>
          ${attributesHtml}
          
          <div class="card-meta-row">
            <div class="card-price-info">
              <span class="card-price-label">Price</span>
              <div class="card-price-val">₹${r.price || "1,250"}</div>
            </div>
            <button class="btn-shop" type="button">Select</button>
          </div>
        </div>
      `;
      resultsGrid.appendChild(card);
    });

    // Re-trigger Lucide icon mapping
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // --- SORT UTILITIES ---
  sortDropdown.addEventListener("change", () => {
    const sortType = sortDropdown.value;
    sortResults(sortType);
  });

  function sortResults(type) {
    if (type === "accuracyHigh") currentResults.sort((a, b) => b.accuracy - a.accuracy);
    if (type === "accuracyLow") currentResults.sort((a, b) => a.accuracy - b.accuracy);
    if (type === "priceHigh") currentResults.sort((a, b) => b.price - a.price);
    if (type === "priceLow") currentResults.sort((a, b) => a.price - b.price);
    if (type === "new") {
      currentResults.sort((a, b) => {
        const dateA = a.date_added ? new Date(a.date_added) : new Date("2026-01-01");
        const dateB = b.date_added ? new Date(b.date_added) : new Date("2026-01-01");
        return dateB - dateA;
      });
    }
    if (type === "old") {
      currentResults.sort((a, b) => {
        const dateA = a.date_added ? new Date(a.date_added) : new Date("2026-01-01");
        const dateB = b.date_added ? new Date(b.date_added) : new Date("2026-01-01");
        return dateA - dateB;
      });
    }
    updateResultsView();
  }

  // --- FAVORITES MANAGEMENT SYSTEM ---
  function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem("foundation_favorites") || "[]");
    
    if (favorites.length === 0) {
      favoritesSection.classList.add("hidden");
      favoritesGrid.innerHTML = "";
      return;
    }
    
    favoritesSection.classList.remove("hidden");
    favoritesGrid.innerHTML = "";
    favoritesCount.innerText = `You have bookmarked ${favorites.length} customized formula${favorites.length > 1 ? 's' : ''}`;
    
    favorites.forEach((r) => {
      const card = document.createElement("div");
      card.className = "shade-card";
      
      const accuracyText = r.accuracy ? `${r.accuracy}% Match` : "98% Match";
      
      let attributesHtml = "";
      if (r.spf || r.coverage || r.finish || r.undertone) {
        attributesHtml = `<div class="card-attributes" style="display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 12px 0;">`;
        if (r.spf) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">SPF ${r.spf}</span>`;
        }
        if (r.coverage) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.coverage}</span>`;
        }
        if (r.finish) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.finish}</span>`;
        }
        if (r.undertone) {
          attributesHtml += `<span class="attr-badge" style="font-size: 10px; background: rgba(0,0,0,0.03); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid rgba(0,0,0,0.06);">${r.undertone}</span>`;
        }
        attributesHtml += `</div>`;
      }
      
      card.innerHTML = `
        <div class="match-badge-wrapper">
          <span class="match-badge">${accuracyText}</span>
        </div>
        <div class="favorite-btn-wrapper">
          <button class="btn-favorite is-active" data-brand="${r.brand}" data-name="${r.name}" data-shade="${r.shade || ''}" title="Remove from favorites">
            <i data-lucide="heart" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="card-swatch-area">
          <div class="color-swatch-fluid" style="background: ${r.hex};">
            <div class="swatch-sheen"></div>
          </div>
          <button type="button" class="btn-ar-tryon-overlay" data-brand="${r.brand}" data-name="${r.name}" data-shade="${r.shade || ''}" data-hex="${r.hex}">
            <i data-lucide="camera" style="width: 13px; height: 13px; margin-right: 5px;"></i> AR Try-On
          </button>
        </div>
        <div class="card-info">
          <span class="card-brand">${r.brand || "Luxury Brand"}</span>
          <h3 class="card-title">${r.name || "Perfect Finish"}</h3>
          ${attributesHtml}
          
          <div class="card-meta-row">
            <div class="card-price-info">
              <span class="card-price-label">Price</span>
              <div class="card-price-val">₹${r.price || "1,250"}</div>
            </div>
            <button class="btn-shop" type="button">Select</button>
          </div>
        </div>
      `;
      favoritesGrid.appendChild(card);
    });
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function toggleFavorite(shadeRef) {
    const favorites = JSON.parse(localStorage.getItem("foundation_favorites") || "[]");
    const existingIndex = favorites.findIndex(f => f.brand === shadeRef.brand && f.name === shadeRef.name && (f.shade || '') === (shadeRef.shade || ''));
    
    if (existingIndex > -1) {
      // Remove from favorites
      favorites.splice(existingIndex, 1);
      localStorage.setItem("foundation_favorites", JSON.stringify(favorites));
    } else {
      // Add to favorites - find full object in currentResults
      const fullObj = currentResults.find(r => r.brand === shadeRef.brand && r.name === shadeRef.name && (r.shade || '') === (shadeRef.shade || ''));
      if (fullObj) {
        favorites.push(fullObj);
        localStorage.setItem("foundation_favorites", JSON.stringify(favorites));
      }
    }
    
    // Synchronize both views
    updateResultsView();
    renderFavorites();
  }

  // Set up click event delegation for favorite buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-favorite");
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const brand = btn.getAttribute("data-brand");
    const name = btn.getAttribute("data-name");
    const shade = btn.getAttribute("data-shade");
    
    toggleFavorite({ brand, name, shade });
  });

  // --- PRICE FILTER ENGINE & EVENT LISTENERS ---
  let activePriceRange = "all";

  function getFilteredResults() {
    if (activePriceRange === "affordable") {
      return currentResults.filter(r => r.price < 1000);
    } else if (activePriceRange === "luxury") {
      return currentResults.filter(r => r.price >= 1000);
    }
    return currentResults;
  }

  function updateResultsView() {
    displayResults(getFilteredResults());
  }

  // Set up click listeners for price range filter buttons
  const priceToggleBtns = document.querySelectorAll(".price-toggle-btn");
  priceToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      priceToggleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      activePriceRange = btn.getAttribute("data-range");
      updateResultsView();
    });
  });

  // --- AR VIRTUAL TRY-ON CONTROLLER ENGINE ---
  const arModal = document.getElementById("arTryOnModal");
  const arVideo = document.getElementById("arVideo");
  const arMaskOverlay = document.getElementById("arMaskOverlay");
  const arSplitDivider = document.getElementById("arSplitDivider");
  const arFaceGuide = document.getElementById("arFaceGuide");
  
  const arOpacitySlider = document.getElementById("arOpacitySlider");
  const arOpacityVal = document.getElementById("arOpacityVal");
  const arSplitToggle = document.getElementById("arSplitToggle");
  
  const arActiveShadeInfo = document.getElementById("arActiveShadeInfo");
  const arFooterBrand = document.getElementById("arFooterBrand");
  const arFooterShadeName = document.getElementById("arFooterShadeName");
  const arActiveSwatchColor = document.getElementById("arActiveSwatchColor");
  
  const btnCloseArModal = document.getElementById("btnCloseArModal");
  const btnArFavoriteToggle = document.getElementById("btnArFavoriteToggle");
  
  let arStream = null;
  let activeArShade = null; 
  let activeBlendMode = "color";

  function openArTryOn(shadeData) {
    activeArShade = shadeData;
    
    // Update live labels and swatch values
    arActiveShadeInfo.innerText = `${shadeData.brand} - ${shadeData.name} ${shadeData.shade ? '(' + shadeData.shade + ')' : ''}`;
    arFooterBrand.innerText = shadeData.brand;
    arFooterShadeName.innerText = `${shadeData.name} ${shadeData.shade ? '(' + shadeData.shade + ')' : ''}`;
    arActiveSwatchColor.style.backgroundColor = shadeData.hex;
    arMaskOverlay.style.backgroundColor = shadeData.hex;
    
    // Check favorite status inside modal
    const favorites = JSON.parse(localStorage.getItem("foundation_favorites") || "[]");
    const isFav = favorites.some(fav => fav.brand === shadeData.brand && fav.name === shadeData.name && (fav.shade || '') === (shadeData.shade || ''));
    updateArFavButtonUI(isFav);

    // Reset overlay styles to default presets
    activeBlendMode = "color";
    const activePillBtn = document.querySelector(`.ar-pill-btn[data-blend="color"]`);
    if (activePillBtn) {
      document.querySelectorAll(".ar-pill-btn").forEach(b => b.classList.remove("active"));
      activePillBtn.classList.add("active");
    }
    arMaskOverlay.style.mixBlendMode = activeBlendMode;
    arOpacitySlider.value = 40;
    arSplitToggle.checked = false;
    updateArMask();

    // Reveal live mirror modal
    arModal.classList.remove("hidden");

    // Initiate webcam feed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
          arStream = stream;
          arVideo.srcObject = stream;
          arVideo.play().catch(e => console.log("Mirror stream play interrupted", e));
          
          // Show face position outline
          arFaceGuide.style.opacity = "1";
          const guideText = arFaceGuide.querySelector(".ar-guide-text");
          if (guideText) {
            guideText.innerText = "Position face inside guide";
          }
        })
        .catch(err => {
          console.warn("Camera blocked or permission denied. Loading high-fidelity background simulation.", err);
          fallbackToSimulation();
        });
    } else {
      console.warn("User media APIs not supported. Loading simulation.");
      fallbackToSimulation();
    }
  }

  function fallbackToSimulation() {
    arFaceGuide.style.opacity = "1";
    const guideText = arFaceGuide.querySelector(".ar-guide-text");
    if (guideText) {
      guideText.innerText = "Camera Unavailable - Abstract Tone Mapping Active";
    }
  }

  function closeArTryOn() {
    arModal.classList.add("hidden");
    
    // Stop and clear browser webcam handles
    if (arStream) {
      arStream.getTracks().forEach(track => track.stop());
      arStream = null;
    }
    if (arVideo) {
      arVideo.srcObject = null;
    }
    activeArShade = null;
  }

  function updateArMask() {
    const opacity = arOpacitySlider.value / 100;
    arOpacityVal.innerText = `${arOpacitySlider.value}%`;
    arMaskOverlay.style.opacity = opacity.toString();
    
    // Dynamic clip path rendering for split-screen comparison mode
    if (arSplitToggle.checked) {
      arMaskOverlay.style.clipPath = "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)";
      arSplitDivider.classList.remove("hidden");
    } else {
      arMaskOverlay.style.clipPath = "none";
      arSplitDivider.classList.add("hidden");
    }
  }

  function updateArFavButtonUI(isFav) {
    if (isFav) {
      btnArFavoriteToggle.innerHTML = `<i data-lucide="heart"></i> Saved to Vault`;
      btnArFavoriteToggle.style.backgroundColor = "var(--color-primary)";
      btnArFavoriteToggle.style.color = "#FFF";
      btnArFavoriteToggle.style.borderColor = "var(--color-primary)";
    } else {
      btnArFavoriteToggle.innerHTML = `<i data-lucide="heart"></i> Save Shade`;
      btnArFavoriteToggle.style.backgroundColor = "";
      btnArFavoriteToggle.style.color = "";
      btnArFavoriteToggle.style.borderColor = "";
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Bind controls inside the Virtual Mirror Modal
  if (btnCloseArModal) {
    btnCloseArModal.addEventListener("click", closeArTryOn);
  }

  arModal.addEventListener("click", (e) => {
    if (e.target === arModal) {
      closeArTryOn();
    }
  });

  if (arOpacitySlider) {
    arOpacitySlider.addEventListener("input", updateArMask);
  }

  if (arSplitToggle) {
    arSplitToggle.addEventListener("change", updateArMask);
  }

  const arPillBtns = document.querySelectorAll(".ar-pill-btn");
  arPillBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      arPillBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeBlendMode = btn.getAttribute("data-blend");
      arMaskOverlay.style.mixBlendMode = activeBlendMode;
    });
  });

  if (btnArFavoriteToggle) {
    btnArFavoriteToggle.addEventListener("click", () => {
      if (!activeArShade) return;
      
      toggleFavorite(activeArShade);
      
      // Re-read storage and refresh UI
      const favorites = JSON.parse(localStorage.getItem("foundation_favorites") || "[]");
      const isFav = favorites.some(fav => fav.brand === activeArShade.brand && fav.name === activeArShade.name && (fav.shade || '') === (activeArShade.shade || ''));
      updateArFavButtonUI(isFav);
    });
  }

  // Click handler delegation for AR Try-On button triggers
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-ar-tryon-overlay");
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const brand = btn.getAttribute("data-brand");
    const name = btn.getAttribute("data-name");
    const shade = btn.getAttribute("data-shade");
    const hex = btn.getAttribute("data-hex");
    
    openArTryOn({ brand, name, shade, hex });
  });

  // Load and render existing favorites on launch
  renderFavorites();
});

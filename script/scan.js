// ============================================================
// SCAN PAGE — image upload, preview, camera capture, aur
// Analyze button se agli page (process.html) pe bhejna
// ============================================================

// Page ke saare zaroori elements ek jagah pakad lo
const browseBtn = document.getElementById("browseBtn");
const fileInput = document.getElementById("scanImageInput");
const uploadCard = document.getElementById("uploadCard");
const previewCard = document.getElementById("previewCard");
const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");
const changeImageBtn = document.getElementById("changeImageBtn");
const analyzeBtn = document.getElementById("analyze");


// Step 1: "Browse Files" click karne par file-picker khulega
function setupBrowseButton() {
    browseBtn.addEventListener("click", () => {
        fileInput.click();
    });
}


// Step 2: Jab user koi image select kare, uska preview dikhao
function setupFileSelected() {
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        fileName.innerText = file.name;
        previewImage.src = URL.createObjectURL(file);

        uploadCard.classList.add("d-none");
        previewCard.classList.remove("d-none");
    });
}


// Step 3: "Change Image" click karne par wapas upload screen pe jao
function setupChangeImageButton() {
    changeImageBtn.addEventListener("click", () => {
        fileInput.value = "";
        previewImage.src = "";
        previewCard.classList.add("d-none");
        uploadCard.classList.remove("d-none");
    });
}


// Step 4: "Analyze Product" click karne par image ko save karke
// process.html pe bhej do (waha AI analysis hoga)
function setupAnalyzeButton() {
    analyzeBtn.onclick = (e) => {
        e.preventDefault();

        if (!fileInput.files[0]) {
            alert("No file selected!");
            return;
        }

        // Image ko text format (base64) me convert karo taaki
        // sessionStorage me save ho sake aur agli page use kar sake
        const reader = new FileReader();
        reader.onload = () => {
            sessionStorage.setItem("scannedImage", reader.result);      // report page pe dikhane ke liye
            sessionStorage.setItem("scanImageForAnalysis", reader.result); // AI ko bhejne ke liye
            window.location = "./process.html";
        };
        reader.readAsDataURL(fileInput.files[0]);
    };
}


// ============================================================
// WEBCAM FEATURE — "Use Camera" se live photo click karna
// ============================================================

const useCameraBtn = document.querySelector(".btn-tertiary");
const cameraModalEl = document.getElementById("cameraModal");
const cameraModal = new bootstrap.Modal(cameraModalEl);
const video = document.getElementById("cameraStream");
const canvas = document.getElementById("cameraCanvas");
const captureBtn = document.getElementById("captureBtn");
let cameraStream = null; // camera on rehte waqt uski feed yahan store hoti hai


// Step 5: "Use Camera" click karne par camera permission maango aur video dikhao
function setupOpenCamera() {
    useCameraBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            video.srcObject = cameraStream;
            cameraModal.show();
        } catch (err) {
            alert("Camera access failed: " + err.message);
        }
    });
}


// Step 6: "Capture Photo" click karne par current video frame ko photo bana do
function setupCapturePhoto() {
    captureBtn.addEventListener("click", () => {
        // Video ka current frame canvas pe draw karo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);

        // Canvas ko image file me convert karo
        canvas.toBlob((blob) => {
            const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

            // Is file ko fileInput me daal do — jaise koi file browse ki ho
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(capturedFile);
            fileInput.files = dataTransfer.files;

            // "change" event trigger karo taaki preview wala code apne aap chal jaye
            fileInput.dispatchEvent(new Event("change"));

            stopCamera();
            cameraModal.hide();
        }, "image/jpeg");
    });
}


// Step 7: Camera band karo (modal close hone par bhi)
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
}

function setupCameraCloseCleanup() {
    cameraModalEl.addEventListener("hidden.bs.modal", stopCamera);
}


// ============================================================
// SABKO SETUP KARO — page load hote hi ye sab chalega
// ============================================================
setupBrowseButton();
setupFileSelected();
setupChangeImageButton();
setupAnalyzeButton();
setupOpenCamera();
setupCapturePhoto();
setupCameraCloseCleanup();
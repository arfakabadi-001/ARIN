//    scan page 

const browseBtn = document.getElementById("browseBtn");
const fileInput = document.getElementById("scanImageInput");

const uploadCard = document.getElementById("uploadCard");
const previewCard = document.getElementById("previewCard");

const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");

// Open file picker
browseBtn.addEventListener("click", () => {
    fileInput.click();
});

// When user selects image
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    fileName.innerText = file.name;
    const imageURL = URL.createObjectURL(file);
    previewImage.src = imageURL;

    uploadCard.classList.add("d-none");
    previewCard.classList.remove("d-none");
});

const changeImageBtn = document.getElementById("changeImageBtn");
changeImageBtn.addEventListener("click", () => {
    fileInput.value = "";
    previewImage.src = "";
    previewCard.classList.add("d-none");
    uploadCard.classList.remove("d-none");
});

const analyze = document.getElementById("analyze");

analyze.onclick = (e) => {
    e.preventDefault();
    if (!fileInput.files[0]) {
        alert("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        sessionStorage.setItem("scannedImage", reader.result);
        sessionStorage.setItem("scanImageForAnalysis", reader.result);
        window.location = "./process.html";
    };
    reader.readAsDataURL(fileInput.files[0]);
};
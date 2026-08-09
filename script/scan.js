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

    // Show file name
    fileName.innerText = file.name;

    // Show image preview
   const imageURL = URL.createObjectURL(file);
previewImage.src = imageURL;

    // Hide upload card
    uploadCard.classList.add("d-none");

    // Show preview card
    previewCard.classList.remove("d-none");

});
const changeImageBtn = document.getElementById("changeImageBtn");

changeImageBtn.addEventListener("click", () => {

    // Clear previous file
    fileInput.value = "";

    // Remove previous preview
    previewImage.src = "";

    // Hide preview card
    previewCard.classList.add("d-none");

    // Show upload card
    uploadCard.classList.remove("d-none");

});
        let analyze = document.getElementById("analyze");
      analyze.onclick = () => {
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("image", file);

    fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        window.location = "./process.html";
    });
};

    // fetch("http://127.0.0.1:5000/test")
    // .then(response => response.text())
    // .then(data => console.log(data));

    // fetch("http://127.0.0.1:5000/analyze",{
    //     method:"POST"
    // })
    // .then(response=>response.text())
    // .then(data=>console.log(data));
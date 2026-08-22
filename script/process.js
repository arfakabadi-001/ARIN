let percentage = document.getElementById("percentage");
let count = 0;
let ring = document.querySelector(".progress-ring");
let animationDone = false;
let backendDone = false;
let reportData = null;

// Current scan ki image ko local variable mein capture kar lo taaki overwrite na ho
const currentScanImage = sessionStorage.getItem("scanImageForAnalysis");

let timer = setInterval(() => {
    if (count >= 100) {
        clearInterval(timer);
        animationDone = true;
        tryRedirect();
        return;
    }
    count++;
    percentage.innerText = count + "%";

    if (count === 25) {
        document.getElementById("icon1").className = "bi bi-check-circle-fill text-success fs-5";
        document.getElementById("status1").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';
        document.getElementById("icon2").className = "bi bi-circle-fill processing-dot fs-5";
        document.getElementById("text2").className = "text-white fw-medium";
        document.getElementById("status2").innerHTML = '<small class="processing-text fw-bold">In Progress</small>';
    } else if (count === 50) {
        document.getElementById("icon2").className = "bi bi-check-circle-fill text-success fs-5";
        document.getElementById("status2").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';
        document.getElementById("icon3").className = "bi bi-circle-fill processing-dot fs-5";
        document.getElementById("text3").className = "text-white fw-medium";
        document.getElementById("status3").innerHTML = '<small class="processing-text fw-bold">In Progress</small>';
    } else if (count === 75) {
        document.getElementById("icon3").className = "bi bi-check-circle-fill text-success fs-5";
        document.getElementById("status3").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';
        document.getElementById("icon4").className = "bi bi-circle-fill processing-dot fs-5";
        document.getElementById("text4").className = "text-white fw-medium";
        document.getElementById("status4").innerHTML = '<small class="processing-text fw-bold">In Progress</small>';
    } else if (count === 100) {
        document.getElementById("icon4").className = "bi bi-check-circle-fill text-success fs-5";
        document.getElementById("status4").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';
        ring.classList.add('completed');
        ring.style.animation = 'none';
    }
}, 100);

// Fetch analysis from backend using the captured image
fetch(currentScanImage)
    .then(res => res.blob())
    .then(blob => {
        const formData = new FormData();
        formData.append("image", blob, "scan.jpg");
        return fetch("https://labellense-1.onrender.com/analyze", { method: "POST", body: formData });
    })
    .then(response => response.json())
    .then(data => {
        reportData = data;
        backendDone = true;
        tryRedirect();
    })
    .catch(err => {
        console.log("FETCH FAILED:", err);
        alert("Analysis failed, please try again.");
        window.location = "./scan.html";
    });

function tryRedirect() {
    if (animationDone && backendDone) {
        // 1. Pass the exact image captured during this specific scan session
        saveProductToShelf(reportData, currentScanImage);

        // 2. Set the product report for display
        sessionStorage.setItem("scanResult", JSON.stringify(reportData));
        window.location = "./product.html";
    } else if (animationDone && !backendDone) {
        percentage.innerText = "Almost there...";
        percentage.style.fontSize = "30px";
    }
}

function saveProductToShelf(data, imageBase64) {
    let shelfItems = JSON.parse(localStorage.getItem('labelLenseShelf')) || [];
    
    const actualReport = data.report || data;

    const newProduct = {
        id: Date.now(),
        image: imageBase64, // Har product ke sath uski apni original base64 image save hogi
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        report: actualReport
    };

    shelfItems.unshift(newProduct);
    localStorage.setItem('labelLenseShelf', JSON.stringify(shelfItems));
}
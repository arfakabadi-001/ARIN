let percentage = document.getElementById("percentage");
let count = 0;
let ring = document.querySelector(".progress-ring");
let animationDone = false;
let backendDone = false;
let reportData = null;

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

// Backend call — animation ke saath parallel chalta hai
const base64Image = sessionStorage.getItem("scanImageForAnalysis");

fetch(base64Image)
    .then(res => res.blob())
    .then(blob => {
        const formData = new FormData();
        formData.append("image", blob, "scan.jpg");
        return fetch("http://127.0.0.1:5000/analyze", { method: "POST", body: formData });
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
        sessionStorage.setItem("scanResult", JSON.stringify(reportData));
        window.location = "./product.html";
    }
}
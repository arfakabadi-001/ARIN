    // process page 
         let percentage = document.getElementById("percentage");
let count = 0;
let ring = document.querySelector(".progress-ring"); // Select the ring

let timer = setInterval(() => {
    if (count >= 100) {
        clearInterval(timer);
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
        } 
        
        // Jab 50% hoyega tb step 2 dn, Step 3 Chalu
        else if (count === 50) {
            document.getElementById("icon2").className = "bi bi-check-circle-fill text-success fs-5";
            document.getElementById("status2").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';

            document.getElementById("icon3").className = "bi bi-circle-fill processing-dot fs-5";
            document.getElementById("text3").className = "text-white fw-medium";
            document.getElementById("status3").innerHTML = '<small class="processing-text fw-bold">In Progress</small>';
        } 
        
    //   step 4
        else if (count === 75) {
            document.getElementById("icon3").className = "bi bi-check-circle-fill text-success fs-5";
            document.getElementById("status3").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';

            document.getElementById("icon4").className = "bi bi-circle-fill processing-dot fs-5";
            document.getElementById("text4").className = "text-white fw-medium";
            document.getElementById("status4").innerHTML = '<small class="processing-text fw-bold">In Progress</small>';
        } 
        
    //    5
        else if (count === 100) {
            document.getElementById("icon4").className = "bi bi-check-circle-fill text-success fs-5";
            document.getElementById("status4").innerHTML = '<i class="bi bi-check-lg text-success fs-5"></i>';
      
        ring.classList.add('completed');
        ring.style.animation = 'none'; 
    }
}, 100);
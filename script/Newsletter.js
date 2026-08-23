document.addEventListener("DOMContentLoaded", () => {
    // Har page pe jitne bhi newsletter forms hain, sabko handle karo
    document.querySelectorAll(".footer-input").forEach(emailInput => {
        const submitBtn = emailInput.nextElementSibling;
        if (!submitBtn) return;

        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();

            if (!email || !email.includes("@")) {
                showToast("Please enter a valid email address", "danger");
                return;
            }

            showToast("Thanks for subscribing! We'll keep you updated.", "success");
            emailInput.value = "";
        });
    });
});

// Bootstrap Toast dynamically banata hai, kisi extra HTML ki zaroorat nahi
function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container position-fixed bottom-0 end-0 p-3";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}
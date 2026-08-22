// ============================================================
// SHELF PAGE — localStorage se saare scanned products nikalo
// aur unhe cards ki tarah dikhao
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    loadShelfProducts();
});


// Step 1: localStorage se saare saved products laao
function getSavedProducts() {
    return JSON.parse(localStorage.getItem('labelLenseShelf')) || [];
}


// Step 2: Score ke hisaab se color-class aur label decide karo
function getScoreStyle(score) {
    if (score <= 50) {
        return { className: "bad-score", label: "Avoid" };
    } else if (score <= 80) {
        return { className: "average-score", label: "Moderate" };
    } else {
        return { className: "good-score", label: "Good" };
    }
}


// Step 3: Ek product ka HTML card banao
function buildProductCard(item) {
    const report = item.report || {};
    const productName = report.product?.name || "Scanned Product";
    const productCategory = report.product?.category || "General";
    const score = report.health_score !== undefined ? report.health_score : 70;
    const scoreOutOf10 = (score / 10).toFixed(1);
    const style = getScoreStyle(score);

    return `
        <div class="shelf-product mb-4" data-id="${item.id}">
            <div class="product-image">
                <img src="${item.image || './assets/haircare.jpg.jpeg'}" alt="${productName}">
            </div>
            <div class="product-info">
                <h3>${productName}</h3>
                <p class="product-category">${productCategory}</p>
                <small>Scanned on ${item.date || 'Today'}</small>
            </div>
            <div class="product-score ${style.className}" style="--score: ${score}%;">
                <div class="score-inner">
                    <strong>${scoreOutOf10}</strong>
                    <span>${style.label}</span>
                </div>
            </div>
            <button class="view-report" onclick="viewSavedReport(${item.id})">
                View Report <i class="fa-solid fa-arrow-right"></i>
            </button>
            <button class="delete-product" onclick="deleteSavedProduct(${item.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
}


// Step 4: Saare products ko page pe dikhao
function loadShelfProducts() {
    const container = document.querySelector(".about-page .row.g-0");
    if (!container) return;

    const products = getSavedProducts();

    products.forEach(item => {
        container.insertAdjacentHTML('beforeend', buildProductCard(item));
    });
}


// Step 5: Product delete karo shelf se
function deleteSavedProduct(id) {
    let products = getSavedProducts();
    products = products.filter(item => Number(item.id) !== Number(id));
    localStorage.setItem('labelLenseShelf', JSON.stringify(products));
    location.reload();
}


// Step 6: "View Report" click karne par uska report page kholo
function viewSavedReport(id) {
    const products = getSavedProducts();
    const product = products.find(item => Number(item.id) === Number(id));

    if (!product || !product.report) {
        alert("Report data not found for this product!");
        return;
    }

    // Report page ko chahiye: report data + uski apni image
    sessionStorage.setItem('scanResult', JSON.stringify({ report: product.report }));
    sessionStorage.setItem('scannedImage', product.image);

    window.location.href = './product.html';
}
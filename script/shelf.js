// ============================================================
// SHELF PAGE — localStorage se saare scanned products nikalo
// aur unhe cards ki tarah dikhao
// ============================================================


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
// Search box se products filter karo
function setupSearch() {
    const searchInput = document.querySelector(".shelf-search input");
    if (!searchInput) return;
    searchInput.addEventListener("input", filterShelfProducts);
}

// Category buttons (All / Food & Beverages / etc.) se filter karo
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll(".shelf-filter");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filterShelfProducts();
        });
    });
}

// Search text + selected category dono ke hisaab se cards show/hide karo
function filterShelfProducts() {
    const searchTerm = document.querySelector(".shelf-search input")?.value.toLowerCase() || "";
    const activeBtn = document.querySelector(".shelf-filter.active");
    const activeCategory = activeBtn ? activeBtn.innerText.trim() : "All";

    document.querySelectorAll(".shelf-product").forEach(card => {
        const name = card.querySelector(".product-info h3")?.innerText.toLowerCase() || "";
        const category = card.querySelector(".product-category")?.innerText.trim() || "";

        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = activeCategory === "All" || category === activeCategory;

        card.style.display = (matchesSearch && matchesCategory) ? "" : "none";
    });
}
document.addEventListener("DOMContentLoaded", () => {
    loadShelfProducts();
    setupSearch();
    setupCategoryFilters();
});
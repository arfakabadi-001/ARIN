// ============================================================
// REPORT PAGE — sessionStorage se AI ka result nikal ke
// page ke har hisse (score, nutrition, ingredients, etc.) me bharta hai
// ============================================================

// Step 1: sessionStorage se saved report nikalo
const data = JSON.parse(sessionStorage.getItem("scanResult")).report;


// Step 2: Product ki basic info (naam, image, brand) dikhao
function showProductInfo() {
    const savedImage = sessionStorage.getItem("scannedImage");
    document.getElementById("productImage").src =
        savedImage || "https://placehold.co/150x150/1a1a2e/4adab3?text=Product";

    document.getElementById("productName").innerText = data.product.name;
    document.getElementById("productVariant").innerText = data.product.variant;
    document.getElementById("productBrand").innerText = data.product.brand;
}


// Step 3: Health score ring aur uska color (red/yellow/green) dikhao
function showHealthScore() {
    const score = data.health_score;
    document.getElementById("healthScore").innerText = score;
    document.getElementById("recLabel").innerText = data.recommendation.label;
    document.getElementById("recDesc").innerText = data.recommendation.description;

    // Score ke hisaab se color decide karo
    let ringColor = "#2f8a5e";       // green = safe (80+)
    let statusText = "Good Choice";
    let textClass = "text-success fw-semibold";

    if (score < 50) {
        ringColor = "#e5484d";       // red = risky
        statusText = "Risky Choice";
        textClass = "text-danger fw-semibold";
    } else if (score < 80) {
        ringColor = "#f5c04a";       // yellow = moderate
        statusText = "Moderate Choice";
        textClass = "text-warning fw-semibold";
    }

    // Ring ko usi color se bharo (score jitna, utna hissa fill hoga)
    const fillDegree = (score / 100) * 360;
    document.querySelector(".health-circle").style.background =
        `conic-gradient(${ringColor} 0deg ${fillDegree}deg, #1d2235 ${fillDegree}deg 360deg)`;

    // "Good Choice" / "Risky Choice" wala text update karo
    const statusEl = document.querySelector(".health-circle").closest(".col-lg-4").querySelector(".text-success");
    if (statusEl) {
        statusEl.innerText = statusText;
        statusEl.className = textClass;
    }
}


// Step 4: Nutrition ke numbers (calories, protein, sugar, etc.) dikhao
function showNutrition() {
    document.getElementById("calVal").innerText = data.nutrition.calories;
    document.getElementById("proteinVal").innerText = data.nutrition.protein;
    document.getElementById("sugarVal").innerText = data.nutrition.sugar;
    document.getElementById("fatVal").innerText = data.nutrition.fat;
    document.getElementById("fiberVal").innerText = data.nutrition.fiber;
    document.getElementById("sodiumVal").innerText = data.nutrition.sodium;
}


// Step 5: Health indicator cards (Sugar: Good, Sodium: Moderate, etc.)
function showHealthIndicators() {
    const colorClass = { green: "health-green", yellow: "health-yellow", red: "health-red" };
    const icon = { green: "bi-check-circle-fill", yellow: "bi-exclamation-circle-fill", red: "bi-x-circle-fill" };

    const cardsHtml = data.health_indicators.map(indicator => `
        <div class="col-lg col-md-6">
            <div class="health-card ${colorClass[indicator.status]} p-3 rounded-4 h-100">
                <div class="d-flex align-items-center mb-2">
                    <i class="bi ${icon[indicator.status]} me-2"></i>
                    <span class="fw-semibold">${indicator.name}</span>
                </div>
                <small>${indicator.note}</small>
            </div>
        </div>
    `).join("");

    document.getElementById("healthIndicators").innerHTML = cardsHtml;
}


// Step 6: Ingredient table (naam, purpose, description, Safe/Risky badge)
function showIngredients() {
    const badgeClass = { Safe: "bg-success", Moderate: "bg-warning", Risky: "bg-danger" };

    const rowsHtml = data.ingredients.map(ingredient => `
        <div class="ingredient-row row align-items-center py-3">
            <div class="col-3"><strong>${ingredient.name}</strong></div>
            <div class="col-2">${ingredient.purpose}</div>
            <div class="col-5 text-secondary">${ingredient.description}</div>
            <div class="col-2 text-center">
                <span class="badge ${badgeClass[ingredient.status]} rounded-pill px-3">${ingredient.status}</span>
            </div>
        </div>
    `).join("");

    document.getElementById("ingredientRows").innerHTML = rowsHtml;
}


// Step 7: Score kyun mila (breakdown) — har deduction ki wajah dikhao
function showScoreBreakdown() {
    const rowsHtml = data.score_breakdown.map(item => `
        <div class="d-flex justify-content-between border-bottom border-secondary py-2">
            <span>${item.factor} <small class="text-secondary">— ${item.reason}</small></span>
            <strong class="${item.points < 0 ? 'text-danger' : 'text-success'}">
                ${item.points === 0 ? '✓' : item.points}
            </strong>
        </div>
    `).join("");

    document.getElementById("scoreBreakdown").innerHTML = rowsHtml;
}


// Step 8: Label ke marketing claims verify karo (agar koi mile to)
function showClaimsCheck() {
    if (!data.claims_check || data.claims_check.length === 0) return;

    document.getElementById("claimsCard").style.display = "block";
    const verdictClass = {
        "Supported": "bg-success",
        "Partially Supported": "bg-warning",
        "Not Supported": "bg-danger"
    };

    const rowsHtml = data.claims_check.map(claim => `
        <div class="mb-3 pb-3 border-bottom border-secondary">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong>"${claim.claim}"</strong>
                <span class="badge ${verdictClass[claim.verdict]} rounded-pill px-3">${claim.verdict}</span>
            </div>
            <p class="text-secondary mb-0 small">${claim.reason}</p>
        </div>
    `).join("");

    document.getElementById("claimsRows").innerHTML = rowsHtml;
}


// Step 9: Value for money aur behtar options
function showValueAssessment() {
    document.getElementById("valueVerdict").innerText = data.value_assessment.verdict;
    document.getElementById("valueReason").innerText = data.value_assessment.reason;

    const listHtml = data.better_alternatives.map(item => `<li>${item}</li>`).join("");
    document.getElementById("alternativesList").innerHTML = listHtml;
}


// Step 10: Macronutrient pie chart (Carbs/Protein/Fat %) banao
function drawMacroChart() {
    // Calories se roughly percentage nikalo
    const proteinCalories = data.nutrition.protein * 4;
    const fatCalories = data.nutrition.fat * 9;
    const carbCalories = Math.max(0, data.nutrition.calories - proteinCalories - fatCalories);
    const totalCalories = proteinCalories + fatCalories + carbCalories || 1;

    const carbsPercent = Math.round((carbCalories / totalCalories) * 100);
    const proteinPercent = Math.round((proteinCalories / totalCalories) * 100);
    const fatPercent = Math.round((fatCalories / totalCalories) * 100);
    const othersPercent = Math.max(0, 100 - carbsPercent - proteinPercent - fatPercent);

    const chartData = [carbsPercent, proteinPercent, fatPercent, othersPercent];

    new Chart(document.getElementById("macroChart"), {
        type: "pie",
        data: {
            labels: ["Carbs", "Protein", "Fat", "Others"],
            datasets: [{
                data: chartData,
                backgroundColor: ["#6c63d9", "#4adab3", "#f5c04a", "#e56b72"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
    });

    // Legend ke % bhi update karo
    document.querySelectorAll(".legend-item strong").forEach((el, i) => {
        el.innerText = chartData[i] + "%";
    });
}


// Step 11: Nutrient level bars (Fiber, Protein, Sugar, Sodium, Fat) bharo
function fillNutrientBars() {
    // Typical daily-value limits (g ya mg me), bar ka % isi se nikalta hai
    const dailyValue = { fiber: 28, protein: 50, sugar: 25, sodium: 2300, fat: 65 };

    const barPercents = {
        "fiber-bar": Math.min(100, (data.nutrition.fiber / dailyValue.fiber) * 100),
        "protein-bar": Math.min(100, (data.nutrition.protein / dailyValue.protein) * 100),
        "sugar-bar": Math.min(100, (data.nutrition.sugar / dailyValue.sugar) * 100),
        "sodium-bar": Math.min(100, (data.nutrition.sodium / dailyValue.sodium) * 100),
        "fat-bar": Math.min(100, (data.nutrition.fat / dailyValue.fat) * 100)
    };

    Object.entries(barPercents).forEach(([className, percent]) => {
        const bar = document.querySelector("." + className);
        if (bar) bar.style.width = percent + "%";
    });
}


// Step 12: AI Summary text dikhao
function showAiSummary() {
    document.getElementById("aiSummaryText").innerText = data.ai_summary;
}


// Step 13: "Share Report" button — mobile pe native share, desktop pe copy
function setupShareButton() {
    const shareBtn = document.getElementById("shareReportBtn");
    if (!shareBtn) return;

    shareBtn.addEventListener("click", async () => {
        const shareText =
            `📋 ${data.product.name} — Health Score: ${data.health_score}/100 (${data.recommendation.label})\n\n` +
            `${data.ai_summary}\n\nAnalyzed with LabelLense 🔍`;

        if (navigator.share) {
            try {
                await navigator.share({ title: `${data.product.name} — LabelLense Report`, text: shareText });
            } catch (err) {
                console.log("Share cancelled or failed:", err);
            }
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert("Report summary copied to clipboard!");
            });
        }
    });
}


// ============================================================
// SABKO CALL KARO — page load hote hi ye sab chalega
// ============================================================
showProductInfo();
showHealthScore();
showNutrition();
showHealthIndicators();
showIngredients();
showScoreBreakdown();
showClaimsCheck();
showValueAssessment();
showAiSummary();
drawMacroChart();
fillNutrientBars();
setupShareButton();
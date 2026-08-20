const data = JSON.parse(sessionStorage.getItem("scanResult")).report;

// Product
const scannedImage = sessionStorage.getItem("scannedImage");
document.getElementById("productImage").src = scannedImage || "https://placehold.co/150x150/1a1a2e/4adab3?text=Product";
document.getElementById("productName").innerText = data.product.name;
// document.getElementById("productImage").src = "https://via.placeholder.com/150x150/1a1a2e/ffffff?text=" + encodeURIComponent(data.product.name.slice(0,10));xx
document.getElementById("productVariant").innerText = data.product.variant;
document.getElementById("productBrand").innerText = data.product.brand;

// Score + recommendation
document.getElementById("healthScore").innerText = data.health_score;
document.getElementById("recLabel").innerText = data.recommendation.label;
document.getElementById("recDesc").innerText = data.recommendation.description;

// Nutrition
document.getElementById("calVal").innerText = data.nutrition.calories;
document.getElementById("proteinVal").innerText = data.nutrition.protein;
document.getElementById("sugarVal").innerText = data.nutrition.sugar;
document.getElementById("fatVal").innerText = data.nutrition.fat;
document.getElementById("fiberVal").innerText = data.nutrition.fiber;
document.getElementById("sodiumVal").innerText = data.nutrition.sodium;

// AI summary
document.getElementById("aiSummaryText").innerText = data.ai_summary;

// Health indicators
const colorClass = { green: "health-green", yellow: "health-yellow", red: "health-red" };
const icon = { green: "bi-check-circle-fill", yellow: "bi-exclamation-circle-fill", red: "bi-x-circle-fill" };

document.getElementById("healthIndicators").innerHTML = data.health_indicators.map(ind => `
    <div class="col-lg col-md-6">
        <div class="health-card ${colorClass[ind.status]} p-3 rounded-4 h-100">
            <div class="d-flex align-items-center mb-2">
                <i class="bi ${icon[ind.status]} me-2"></i>
                <span class="fw-semibold">${ind.name}</span>
            </div>
            <small>${ind.note}</small>
        </div>
    </div>
`).join("");

// Ingredients table
const badgeClass = { Safe: "bg-success", Moderate: "bg-warning", Risky: "bg-danger" };

document.getElementById("ingredientRows").innerHTML = data.ingredients.map(ing => `
    <div class="ingredient-row row align-items-center py-3">
        <div class="col-3"><strong>${ing.name}</strong></div>
        <div class="col-2">${ing.purpose}</div>
        <div class="col-5 text-secondary">${ing.description}</div>
        <div class="col-2 text-center">
            <span class="badge ${badgeClass[ing.status]} rounded-pill px-3">${ing.status}</span>
        </div>
    </div>
`).join("");


// Score breakdown
document.getElementById("scoreBreakdown").innerHTML = data.score_breakdown.map(s => `
    <div class="d-flex justify-content-between border-bottom border-secondary py-2">
        <span>${s.factor} <small class="text-secondary">— ${s.reason}</small></span>
        <strong class="${s.points < 0 ? 'text-danger' : 'text-success'}">${s.points === 0 ? '✓' : s.points}</strong>
    </div>
`).join("");
// Health score ring ko dynamically fill karo
// Health score ring — color range ke hisaab se badalta hai
const score = data.health_score;
const fillDeg = (score / 100) * 360;

let ringColor;
if (score < 50) ringColor = "#e5484d";       // red - risky
else if (score < 80) ringColor = "#f5c04a";  // yellow - moderate
else ringColor = "#2f8a5e";                  // green - safe

document.querySelector(".health-circle").style.background = `conic-gradient(
    ${ringColor} 0deg ${fillDeg}deg,
    #1d2235 ${fillDeg}deg 360deg
)`;

// "Good Choice" text bhi color ke hisaab se badlo
const scoreLabel = document.querySelector(".health-circle").closest(".col-lg-4").querySelector(".text-success");
if (scoreLabel) {
    const labels = { red: "Risky Choice", yellow: "Moderate Choice", green: "Good Choice" };
    const key = score < 50 ? "red" : score < 80 ? "yellow" : "green";
    scoreLabel.innerText = labels[key];
    scoreLabel.className = score < 50 ? "text-danger fw-semibold" : score < 80 ? "text-warning fw-semibold" : "text-success fw-semibold";
    scoreLabel.previousElementSibling ? null : null; // icon change optional
}

// Claims verification
if (data.claims_check && data.claims_check.length > 0) {
    document.getElementById("claimsCard").style.display = "block";
    const verdictClass = { "Supported": "bg-success", "Partially Supported": "bg-warning", "Not Supported": "bg-danger" };
    document.getElementById("claimsRows").innerHTML = data.claims_check.map(c => `
        <div class="mb-3 pb-3 border-bottom border-secondary">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong>"${c.claim}"</strong>
                <span class="badge ${verdictClass[c.verdict]} rounded-pill px-3">${c.verdict}</span>
            </div>
            <p class="text-secondary mb-0 small">${c.reason}</p>
        </div>
    `).join("");
}

// Value + Alternatives
document.getElementById("valueVerdict").innerText = data.value_assessment.verdict;
document.getElementById("valueReason").innerText = data.value_assessment.reason;
document.getElementById("alternativesList").innerHTML = data.better_alternatives.map(a => `<li>${a}</li>`).join("");
// Macro % calculate karo real nutrition data se
const p = data.nutrition.protein * 4, f = data.nutrition.fat * 9;
const c = Math.max(0, data.nutrition.calories - p - f);
const total = p + f + c || 1;
const macroData = [Math.round(c/total*100), Math.round(p/total*100), Math.round(f/total*100)];
macroData.push(Math.max(0, 100 - macroData[0] - macroData[1] - macroData[2]));

new Chart(document.getElementById("macroChart"), {
    type: "pie",
    data: {
        labels: ["Carbs", "Protein", "Fat", "Others"],
        datasets: [{ data: macroData, backgroundColor: ["#6c63d9","#4adab3","#f5c04a","#e56b72"], borderWidth: 0 }]
    },
    options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: true } } }
});

document.querySelectorAll(".legend-item strong").forEach((el, i) => el.innerText = macroData[i] + "%");

// Nutrient bars ko real data se fill karo (rough daily-value % ke hisaab se)
const dv = { fiber: 28, protein: 50, sugar: 25, sodium: 2300, fat: 65 }; // typical daily values (g/mg)
const bars = {
    "fiber-bar": Math.min(100, (data.nutrition.fiber / dv.fiber) * 100),
    "protein-bar": Math.min(100, (data.nutrition.protein / dv.protein) * 100),
    "sugar-bar": Math.min(100, (data.nutrition.sugar / dv.sugar) * 100),
    "sodium-bar": Math.min(100, (data.nutrition.sodium / dv.sodium) * 100),
    "fat-bar": Math.min(100, (data.nutrition.fat / dv.fat) * 100)
};
Object.entries(bars).forEach(([cls, pct]) => {
    const el = document.querySelector("." + cls);
    if (el) el.style.width = pct + "%";
});

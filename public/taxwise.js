/* TaxWise Uganda: home page scripts
   1. Accessible mobile menu
   2. PAYE calculator (FY 2025/26 monthly rates, verify against current URA guidance)
   Load with: <script src="taxwise.js" defer></script> just before </body> */

(function () {
  "use strict";

  /* ---------- 1. Mobile menu ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var nav = document.getElementById("mainNav");

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- 2. PAYE calculator ---------- */
  var gross = document.getElementById("gross");
  var slider = document.getElementById("slide");
  if (!gross || !slider) return;

  var NSSF_RATE = 0.05; // employee contribution

  // Monthly PAYE bands (resident individuals)
  // 0 - 235,000        : 0%
  // 235,001 - 335,000  : 10% of excess over 235,000
  // 335,001 - 410,000  : 20% of excess over 335,000 (+10,000)
  // 410,001 and above  : 30% of excess over 410,000 (+25,000)
  // Above 10,000,000   : extra 10% on the excess over 10,000,000
  function calcPaye(income) {
    var tax = 0;
    if (income > 235000) tax += (Math.min(income, 335000) - 235000) * 0.10;
    if (income > 335000) tax += (Math.min(income, 410000) - 335000) * 0.20;
    if (income > 410000) tax += (income - 410000) * 0.30;
    if (income > 10000000) tax += (income - 10000000) * 0.10;
    return Math.round(tax);
  }

  function money(n) {
    return "UGX " + Math.round(n).toLocaleString("en-US");
  }

  function pct(part, whole) {
    return whole ? ((part / whole) * 100).toFixed(1) + "%" : "0%";
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function render(value) {
    var income = Math.max(0, Number(value) || 0);
    var nssf = Math.round(income * NSSF_RATE);
    var paye = calcPaye(income);

    setText("nssf", money(nssf));
    setText("paye", money(paye));
    setText("net", money(income - nssf - paye));
    setText("prate", pct(paye, income));
    setText("trate", pct(nssf + paye, income));
  }

  gross.addEventListener("input", function () {
    slider.value = gross.value;
    render(gross.value);
  });

  slider.addEventListener("input", function () {
    gross.value = slider.value;
    render(slider.value);
  });

  render(gross.value);
})();

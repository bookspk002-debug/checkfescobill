/* FESCO bill calculator — rates per NEPRA S.R.O. 279(I)/2026, effective 12 Feb 2026.
   Energy rates are the notified per-unit rates. Fixed charges are per kW of
   sanctioned load per month. Unprotected, protected and lifeline consumers pay
   ONE slab rate on ALL units (slab-crossing effect). FC surcharge: Rs 3.23/unit
   (Rs 1.43 for protected; lifeline consumers are exempt). GST 18% on subtotal. */
(function () {
  'use strict';

  var TARIFF = {
    lifeline: [
      { max: 50, rate: 3.95, fixed: 0 },
      { max: 100, rate: 7.74, fixed: 0 }
    ],
    protected: [
      { max: 100, rate: 10.54, fixed: 200 },
      { max: 200, rate: 13.01, fixed: 300 }
    ],
    unprotected: [
      { max: 100, rate: 22.44, fixed: 275 },
      { max: 200, rate: 28.91, fixed: 300 },
      { max: 300, rate: 33.10, fixed: 400 },
      { max: 400, rate: 36.46, fixed: 475 },
      { max: 500, rate: 38.95, fixed: 550 },
      { max: 600, rate: 40.22, fixed: 600 },
      { max: 700, rate: 41.85, fixed: 650 },
      { max: Infinity, rate: 47.20, fixed: 675 }
    ],
    tou: { peak: 46.85, offpeak: 34.53, fixed: 675 }
  };

  var FC_SURCHARGE = { lifeline: 0, protected: 1.43, unprotected: 3.23, tou: 3.23 };
  var GST_RATE = 0.18;

  function round2(n) { return Math.round(n * 100) / 100; }
  function fmt(n) {
    return 'Rs ' + n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function slabFor(category, units) {
    var slabs = TARIFF[category];
    for (var i = 0; i < slabs.length; i++) {
      if (units <= slabs[i].max) return slabs[i];
    }
    return slabs[slabs.length - 1];
  }

  /* Pure calculation — also used by the worked examples on the page. */
  function calculate(opts) {
    var units = Math.max(0, Math.floor(Number(opts.units) || 0));
    var load = Math.max(0, Number(opts.load) || 0);
    var fpa = Number(opts.fpa) || 0;
    var qta = Number(opts.qta) || 0;
    var category = opts.category;

    var lines = [];
    var energy = 0, fixed = 0, fcRate = FC_SURCHARGE[category] || 0;
    var slabLabel = '';

    if (category === 'tou') {
      var peak = Math.max(0, Math.floor(Number(opts.peakUnits) || 0));
      var off = Math.max(0, Math.floor(Number(opts.offpeakUnits) || 0));
      var totalUnits = peak + off;
      energy = peak * TARIFF.tou.peak + off * TARIFF.tou.offpeak;
      fixed = TARIFF.tou.fixed * load;
      slabLabel = 'TOU — peak ' + peak + ' units @ Rs 46.85, off-peak ' + off + ' units @ Rs 34.53';
      lines.push({ label: 'Energy — peak (' + peak + ' × Rs 46.85)', value: round2(peak * TARIFF.tou.peak) });
      lines.push({ label: 'Energy — off-peak (' + off + ' × Rs 34.53)', value: round2(off * TARIFF.tou.offpeak) });
      return finish(totalUnits, energy, fixed, fcRate, fpa, qta, slabLabel, lines, category);
    }

    var slab = slabFor(category, units);
    energy = units * slab.rate;
    fixed = slab.fixed * load;
    var range = category === 'lifeline'
      ? (units <= 50 ? '1–50' : '51–100')
      : (category === 'protected'
        ? (units <= 100 ? '1–100' : '101–200')
        : slabLabelRange(units));
    slabLabel = categoryLabel(category) + ' — ' + range + ' units @ Rs ' + slab.rate.toFixed(2);
    lines.push({ label: 'Energy (' + units + ' units × Rs ' + slab.rate.toFixed(2) + ')', value: round2(energy) });
    return finish(units, energy, fixed, fcRate, fpa, qta, slabLabel, lines, category);
  }

  function slabLabelRange(units) {
    var bounds = [100, 200, 300, 400, 500, 600, 700];
    var lo = 1;
    for (var i = 0; i < bounds.length; i++) {
      if (units <= bounds[i]) return lo + '–' + bounds[i];
      lo = bounds[i] + 1;
    }
    return '700+';
  }

  function categoryLabel(category) {
    return { lifeline: 'Lifeline', protected: 'Protected', unprotected: 'Unprotected', tou: 'TOU' }[category] || category;
  }

  function finish(units, energy, fixed, fcRate, fpa, qta, slabLabel, lines, category) {
    var fpaAmt = round2(units * fpa);
    var qtaAmt = round2(units * qta);
    var fcAmt = round2(units * fcRate);
    lines.push({ label: 'Fixed charge', value: round2(fixed) });
    if (fpa !== 0) lines.push({ label: 'Fuel price adjustment (FPA ' + units + ' × Rs ' + fpa + ')', value: fpaAmt });
    if (qta !== 0) lines.push({ label: 'Quarterly tariff adjustment (QTA ' + units + ' × Rs ' + qta + ')', value: qtaAmt });
    lines.push({ label: 'Financing cost surcharge (' + units + ' × Rs ' + fcRate.toFixed(2) + ')', value: fcAmt });
    var subtotal = round2(energy + fixed + fpaAmt + qtaAmt + fcAmt);
    var gst = round2(subtotal * GST_RATE);
    var total = round2(subtotal + gst);
    return {
      units: units,
      category: category,
      slabLabel: slabLabel,
      lines: lines,
      subtotal: subtotal,
      gst: gst,
      total: total,
      effective: units > 0 ? round2(total / units) : 0
    };
  }

  /* ---- DOM wiring ---- */
  function $(id) { return document.getElementById(id); }

  function init() {
    var form = $('calc-form');
    if (!form) return;
    var categoryRadios = form.querySelectorAll('input[name="category"]');
    var touFields = $('tou-fields');
    var unitsField = $('units-field');

    function syncCategory() {
      var cat = form.querySelector('input[name="category"]:checked').value;
      var isTou = cat === 'tou';
      touFields.style.display = isTou ? 'block' : 'none';
      unitsField.style.display = isTou ? 'none' : 'block';
      var hint = $('category-hint');
      if (hint) {
        hint.textContent = cat === 'lifeline'
          ? 'Lifeline applies to very low usage (up to 100 units). No fixed charge.'
          : cat === 'protected'
          ? 'Protected applies if you used 200 units or less in each of the last 6 months.'
          : cat === 'unprotected'
          ? 'Unprotected: one slab rate applies to ALL units — crossing a slab raises the rate on your whole bill.'
          : 'TOU (time of use): peak hours are 6 PM–10 PM. Enter peak and off-peak units separately.';
      }
    }
    categoryRadios.forEach(function (r) { r.addEventListener('change', syncCategory); });
    syncCategory();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cat = form.querySelector('input[name="category"]:checked').value;
      var res = calculate({
        category: cat,
        units: $('units').value,
        peakUnits: $('peak-units').value,
        offpeakUnits: $('offpeak-units').value,
        load: $('load').value,
        fpa: $('fpa').value,
        qta: $('qta').value
      });
      render(res);
    });

    function render(res) {
      var box = $('calc-result');
      $('res-slab').textContent = res.slabLabel;
      var tbody = $('res-lines');
      tbody.innerHTML = '';
      res.lines.forEach(function (l) {
        var tr = document.createElement('tr');
        var td1 = document.createElement('td'); td1.textContent = l.label;
        var td2 = document.createElement('td'); td2.textContent = fmt(l.value);
        tr.appendChild(td1); tr.appendChild(td2);
        tbody.appendChild(tr);
      });
      var trSub = document.createElement('tr');
      var tdS1 = document.createElement('td'); tdS1.textContent = 'Subtotal';
      var tdS2 = document.createElement('td'); tdS2.textContent = fmt(res.subtotal);
      trSub.appendChild(tdS1); trSub.appendChild(tdS2);
      tbody.appendChild(trSub);
      var trGst = document.createElement('tr'); trGst.className = 'gst';
      var tdG1 = document.createElement('td'); tdG1.textContent = 'GST @ 18%';
      var tdG2 = document.createElement('td'); tdG2.textContent = fmt(res.gst);
      trGst.appendChild(tdG1); trGst.appendChild(tdG2);
      tbody.appendChild(trGst);
      var trTot = document.createElement('tr'); trTot.className = 'total';
      var tdT1 = document.createElement('td'); tdT1.textContent = 'Estimated total bill';
      var tdT2 = document.createElement('td'); tdT2.textContent = fmt(res.total);
      trTot.appendChild(tdT1); trTot.appendChild(tdT2);
      tbody.appendChild(trTot);
      $('res-effective').innerHTML = 'Effective rate: <strong>' + fmt(res.effective) + ' per unit</strong> <small>for ' + res.units + ' units</small>';
      var warn = $('slab-warning');
      if (res.category === 'unprotected' && res.units > 100) {
        warn.style.display = 'block';
        warn.querySelector('p').innerHTML = '<strong>Slab-crossing effect:</strong> your whole ' + res.units + ' units are billed at the higher slab rate. Just a few units over a slab boundary can add hundreds of rupees — check the table below to see how close you are to the next slab.';
      } else {
        warn.style.display = 'none';
      }
      box.classList.add('show');
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  /* Expose for verification in Node. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate: calculate, TARIFF: TARIFF };
  }
})();

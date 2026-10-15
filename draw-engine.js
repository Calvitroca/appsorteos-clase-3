/* Lógica independiente del DOM para poder estudiar y comprobar el sorteo. */
(function (root) {
  'use strict';
  const MAX_ENTRIES = 10000;
  function key(value) { return String(value).normalize('NFKC').trim().toLocaleLowerCase('es'); }
  function parseEntries(text) {
    // Nombres con espacios permanecen completos. Una coma separa entradas.
    const entries = String(text).replace(/^\uFEFF/, '').split(/[\n\r,;]+/).map(s => s.trim()).filter(Boolean);
    if (entries.length > MAX_ENTRIES) throw new Error('Puedes cargar hasta 10,000 entradas por sorteo.');
    if (entries.some(s => s.length > 160)) throw new Error('Cada participante puede tener hasta 160 caracteres.');
    return entries;
  }
  function createRange(from, to) {
    if (String(from).trim() === '' || String(to).trim() === '') throw new Error('Completa los dos extremos del rango.');
    const first = Number(from), last = Number(to);
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) throw new Error('Escribe números enteros válidos.');
    if (last < first) throw new Error('El número final debe ser igual o mayor que el inicial.');
    if (last - first + 1 > MAX_ENTRIES) throw new Error('El rango puede contener hasta 10,000 números.');
    return Array.from({length:last - first + 1}, (_,i) => String(first + i));
  }
  function prepareEntries(entries, deduplicate, excludedText) {
    const excluded = new Set(parseEntries(excludedText || '').map(key));
    const seen = new Set();
    let duplicates = 0, excludedCount = 0;
    const eligible = [];
    for (const value of entries) {
      const normalized = key(value);
      if (deduplicate && seen.has(normalized)) { duplicates++; continue; }
      seen.add(normalized);
      if (excluded.has(normalized)) { excludedCount++; continue; }
      eligible.push(value);
    }
    return {eligible, duplicates, excludedCount, total:entries.length};
  }
  function randomIndex(max) {
    if (!Number.isInteger(max) || max < 1 || max > 0x100000000) throw new Error('Rango aleatorio inválido.');
    // Rechazo de valores sobrantes: evita el sesgo de aplicar módulo directamente.
    const limit = Math.floor(0x100000000 / max) * max;
    const word = new Uint32Array(1);
    do { root.crypto.getRandomValues(word); } while (word[0] >= limit);
    return word[0] % max;
  }
  function validateCounts(entries, winners, alternates) {
    if (!Number.isInteger(winners) || winners < 1 || winners > 100) throw new Error('Elige entre 1 y 100 ganadores.');
    if (!Number.isInteger(alternates) || alternates < 0 || alternates > 100) throw new Error('Elige entre 0 y 100 suplentes.');
    if (winners + alternates > entries.length) throw new Error('No hay suficientes participantes para los ganadores y suplentes seleccionados.');
  }
  function sampleEntries(entries, count, rng) {
    const pool = entries.slice();
    const index = rng || randomIndex;
    // Fisher–Yates parcial: cada entrada tiene la misma posibilidad de ser elegida.
    for (let i = 0; i < count; i++) {
      const j = i + index(pool.length - i);
      [pool[i],pool[j]] = [pool[j],pool[i]];
    }
    return pool.slice(0,count);
  }
  function selectWinners(entries, winners, alternates, rng) {
    validateCounts(entries,winners,alternates);
    const selected=sampleEntries(entries,winners+alternates,rng);
    return {winners:selected.slice(0,winners),alternates:selected.slice(winners)};
  }
  // HARDCODEO: este ganador está escrito en el código y no depende de la lista ni del usuario.
  const GANADOR_FIJO = 'olgardz2';
  // Los primeros puestos se sortean sin GANADOR_FIJO; el último puesto siempre es GANADOR_FIJO.
  function selectFixedWinners(entries, winners, alternates, rng) {
    const rest=entries.filter(value=>key(value)!==key(GANADOR_FIJO));
    if (!Number.isInteger(winners) || winners < 1 || winners > 100) throw new Error('Elige entre 1 y 100 ganadores.');
    if (!Number.isInteger(alternates) || alternates < 0 || alternates > 100) throw new Error('Elige entre 0 y 100 suplentes.');
    if (winners - 1 + alternates > rest.length) throw new Error('No hay suficientes participantes para los ganadores y suplentes seleccionados.');
    const picked=sampleEntries(rest,winners-1+alternates,rng);
    return {winners:[...picked.slice(0,winners-1),GANADOR_FIJO],alternates:picked.slice(winners-1)};
  }
  const api = Object.freeze({MAX_ENTRIES,parseEntries,createRange,prepareEntries,selectWinners,selectFixedWinners,GANADOR_FIJO,randomIndex});
  root.DrawEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

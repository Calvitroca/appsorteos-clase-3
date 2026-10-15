/* Ejecutar con: node --test tests/draw-engine.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('../draw-engine.js');

test('listas pegadas: saltos de línea, comas, BOM, nombres completos y vacíos', () => {
  assert.deepEqual(E.parseEntries('\uFEFF101,205;309\r\n Ana María \n\n412'), ['101','205','309','Ana María','412']);
  assert.deepEqual(E.parseEntries('  \n ; , '), []);
  assert.throws(() => E.parseEntries('a'.repeat(161)), /160/);
  assert.throws(() => E.parseEntries(Array(10001).fill('1').join('\n')), /10,000/);
});

test('rangos inclusivos, negativos, límites e inputs incompletos', () => {
  assert.deepEqual(E.createRange('-2','2'), ['-2','-1','0','1','2']);
  assert.deepEqual(E.createRange('5','5'), ['5']);
  assert.equal(E.createRange(1,10000).length,10000);
  for (const pair of [['',10],[1,''],[2,1],[1.1,3],[1,10001],[0,Number.MAX_SAFE_INTEGER+1]]) {
    assert.throws(() => E.createRange(...pair));
  }
});

test('las exclusiones y duplicados usan la misma normalización', () => {
  const source = [' Ana ','ANA','Beto','CARLA','Carla','001','1'];
  const prepared = E.prepareEntries(source,true,' carla, 001 ');
  assert.deepEqual(prepared.eligible,[' Ana ','Beto','1']);
  assert.equal(prepared.duplicates,2);
  assert.equal(prepared.excludedCount,2);
  assert.deepEqual(E.prepareEntries(['7','7','9'],false,'').eligible,['7','7','9']);
});

test('ganadores y suplentes se eligen sin reemplazo y sin modificar la lista', () => {
  const entries = Array.from({length:120},(_,i)=>String(i));
  const original = entries.slice();
  for (let pass=0;pass<250;pass++) {
    const result = E.selectWinners(entries,30,20);
    const all = [...result.winners,...result.alternates];
    assert.equal(result.winners.length,30);
    assert.equal(result.alternates.length,20);
    assert.equal(new Set(all).size,50);
    assert.ok(all.every(name=>entries.includes(name)));
    assert.deepEqual(entries,original);
  }
});

test('validación de cantidades y selección de toda la población', () => {
  assert.throws(()=>E.selectWinners(['1','2'],2,1), /suficientes/);
  assert.throws(()=>E.selectWinners(['1'],0,0), /ganadores/);
  assert.throws(()=>E.selectWinners(['1'],1,-1), /suplentes/);
  assert.throws(()=>E.selectWinners(['1'],1.2,0), /ganadores/);
  assert.deepEqual(E.selectWinners(['1'],1,0),{winners:['1'],alternates:[]});
  assert.deepEqual(new Set(E.selectWinners(['a','b','c'],2,1).winners.concat([])).size,2);
  assert.equal(E.selectWinners(['7','7'],2,0).winners.length,2);
});

test('el generador rechaza la cola de módulo para evitar sesgo', () => {
  const values = [4294967295,7];
  const scope = {crypto:{getRandomValues(array){array[0]=values.shift();return array;}},Uint32Array};
  scope.globalThis=scope;
  vm.runInNewContext(fs.readFileSync(require.resolve('../draw-engine.js'),'utf8'),scope);
  assert.equal(scope.DrawEngine.randomIndex(10),7);
  assert.equal(values.length,0);
});

test('hardcodeo: con 1 ganador siempre sale olgardz2', () => {
  for(let pass=0;pass<100;pass++) assert.deepEqual(E.selectFixedWinners(['Ana','Bruno','olgardz2','Carla'],1,0),{winners:['olgardz2'],alternates:[]});
  assert.deepEqual(E.selectFixedWinners(['Ana','Bruno'],1,0).winners,['olgardz2']);
});

test('hardcodeo: con 2 o 3 ganadores los primeros son al azar y olgardz2 va al final', () => {
  const entries=['Ana','Bruno','olgardz2','Carla','Diego','OLGARDZ2'];
  for(const count of [2,3]) for(let pass=0;pass<100;pass++) {
    const {winners,alternates}=E.selectFixedWinners(entries,count,1);
    assert.equal(winners.length,count);
    assert.equal(winners[count-1],'olgardz2');
    const randoms=[...winners.slice(0,-1),...alternates];
    assert.ok(randoms.every(name=>name.toLowerCase()!=='olgardz2'));
    assert.equal(new Set(randoms).size,randoms.length);
  }
  assert.deepEqual(entries,['Ana','Bruno','olgardz2','Carla','Diego','OLGARDZ2']);
});

test('hardcodeo: valida cantidades sin contar a olgardz2', () => {
  assert.throws(()=>E.selectFixedWinners(['Ana','olgardz2'],3,0),/suficientes/);
  assert.throws(()=>E.selectFixedWinners(['Ana'],0,0),/ganadores/);
});

/* Interfaz: eventos, estado del formulario, animaciones y exportaciones. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const engine = window.DrawEngine;
  const DRAFT_KEY = 'appsorteos-clase-borrador-v1';
  const COLORS = ['#ed2ba3','#ffcd56','#76cfc3','#9578cf','#ef8daf','#7dbae3'];
  const tools = {
    instagram:{title:'Sorteo en Instagram',icon:'instagram',color:'#cf477b',background:'#f5e6ee',hero:'#ed2ba3',description:'Obtén un comentario ganador al azar de tus fotos y videos de Instagram.',card:'Elige un participante de tu comunidad.',placeholder:'Ingresa @username o URL del Post'},
    facebook:{title:'Sorteo en Facebook',icon:'facebook',color:'#267bdc',background:'#e5edf9',hero:'#347be5',description:'Elige al próximo ganador de tu comunidad de Facebook.',card:'Sortea entre las entradas de tu publicación.',placeholder:'Ingresa el nombre o URL de tu publicación'},
    names:{title:'Listado de Nombres',icon:'list-ol',color:'#b48308',background:'#fff5c7',hero:'#e8ad35',description:'Un listado de participantes. Una nueva oportunidad de ganar.',card:'Carga una lista y descubre al ganador.',placeholder:'Ingresa nombres separados por comas'},
    twitter:{title:'Sorteo en Twitter',icon:'twitter',color:'#34343c',background:'#e9e9ed',hero:'#292936',description:'Realiza un sorteo entre los participantes de tu comunidad.',card:'Elige a alguien de tu lista de participantes.',placeholder:'Ingresa @username o URL del Post'},
    multi:{title:'Sorteo Multi-Red',icon:'share-alt',color:'#be5dbe',background:'#f6e7f5',hero:'#a94cbe',description:'Reúne participantes de distintas redes en un solo sorteo.',card:'Reúne varias comunidades en una sola lista.',placeholder:'Ingresa el nombre de tu sorteo'},
    tiktok:{title:'Sorteo en TikTok',icon:'tiktok',color:'#2a2932',background:'#e8e8eb',hero:'#26232f',description:'Tu comunidad de TikTok también tiene una oportunidad de ganar.',card:'Encuentra al ganador entre tus participantes.',placeholder:'Ingresa @username o URL del video'},
    wheel:{title:'La Ruleta Aleatoria',icon:'dharmachakra',color:'#4cb5b1',background:'#e6f6f4',hero:'#50b9b1',description:'Agrega tus opciones, gira la ruleta y deja que la suerte decida.',card:'Un giro para descubrir al próximo ganador.',placeholder:'Ingresa opciones separadas por comas'},
    youtube:{title:'Sorteo en YouTube',icon:'youtube',color:'#d51b30',background:'#f8e5e8',hero:'#e6434e',description:'Elige al próximo ganador entre los participantes de tus videos.',card:'Haz un sorteo con la lista de tu comunidad.',placeholder:'Ingresa el nombre o URL del video'},
    linkedin:{title:'Sorteo en LinkedIn',icon:'linkedin',color:'#167b9e',background:'#e2edf2',hero:'#1788b6',description:'Celebra a tu comunidad con un sorteo entre tus participantes.',card:'Selecciona un ganador de tu publicación.',placeholder:'Ingresa el nombre o URL del Post'},
    bluesky:{title:'Sorteo en Bluesky',icon:'bluesky',color:'#00a6e5',background:'#e1f5fb',hero:'#199fe7',description:'Una comunidad, una lista y un ganador elegido al azar.',card:'Lleva a tu comunidad a un nuevo sorteo.',placeholder:'Ingresa @username o URL del Post'},
    numbers:{title:'Números Aleatorios',icon:'random',color:'#299e8c',background:'#e5f3ed',hero:'#3aa996',description:'Carga tus números o define un rango para realizar un sorteo.',card:'Genera un rango o pega tus propios números.',placeholder:'Ingresa tus números: 101, 205, 309...'},
    twitch:{title:'Sorteo en Twitch',icon:'twitch',color:'#7751b4',background:'#e9e1f4',hero:'#9060d8',description:'Descubre a los ganadores de tu comunidad de Twitch.',card:'Tu comunidad también puede participar.',placeholder:'Ingresa el nombre de tu canal'},
    coin:{title:'Lanza una Moneda',icon:'circle',color:'#b99933',background:'#fff3ca',hero:'#d7b142',description:'Cara o cruz. Una decisión al azar.',card:'Deja que una moneda decida.',placeholder:'Ingresa el título de tu sorteo'},
    dice:{title:'Dados Virtuales',icon:'dice',color:'#239c8d',background:'#e3f3ef',hero:'#3aa996',description:'Un dado, seis posibilidades.',card:'Lanza un dado.',placeholder:'Ingresa el título de tu sorteo'}
  };
  const gridOrder = ['instagram','facebook','names','twitter','multi','tiktok','wheel','youtube','linkedin','bluesky','numbers','twitch'];
  let currentTool = 'instagram';
  let heroTool = 'instagram';
  let inputMode = 'manual';
  let activeScreen = 'participants';
  let prepared = null;
  let result = null;
  let timer = null;
  let shuffleTimer = null;
  let toastTimer = null;
  let draftTimer = null;
  let busy = false;
  let focusBeforeDialog = null;
  let wheelEntries = [];

  // Las plantillas contienen únicamente datos estáticos, nunca el texto del usuario.
  function iconHTML(tool) { return `<span class="app-icon" style="--icon-color:${tool.color};--icon-bg:${tool.background}"><i class="fa-${tool.icon}" aria-hidden="true"></i></span>`; }
  $('apps-grid').innerHTML = gridOrder.map(key => `<button class="app-card" data-open="${key}">${iconHTML(tools[key])}<span><strong>${tools[key].title}</strong><span>${tools[key].card}</span></span><i class="fa-chevron-right card-arrow" aria-hidden="true"></i></button>`).join('');
  $('menu-apps').innerHTML = gridOrder.filter(key => !['numbers','wheel'].includes(key)).map(key => `<button data-open="${key}">${iconHTML(tools[key])}<span>${tools[key].title}</span></button>`).join('');

  function closeDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach(button => { button.setAttribute('aria-expanded','false'); $(button.dataset.dropdown).hidden = true; });
  }
  function closeMobileMenu() { $('navigation').classList.remove('open'); $('mobile-menu').setAttribute('aria-expanded','false'); }
  document.addEventListener('click', event => {
    const dropdown = event.target.closest('[data-dropdown]');
    if (dropdown) {
      const willOpen = $(dropdown.dataset.dropdown).hidden;
      closeDropdowns();
      $(dropdown.dataset.dropdown).hidden = !willOpen;
      dropdown.setAttribute('aria-expanded',String(willOpen));
      return;
    }
    const opener = event.target.closest('[data-open]');
    if (opener) { openDraw(opener.dataset.open); closeDropdowns(); closeMobileMenu(); return; }
    const platform = event.target.closest('[data-platform]');
    if (platform) { selectHero(platform.dataset.platform); return; }
    const info = event.target.closest('[data-info]');
    if (info) { openInfo(info.dataset.info); closeDropdowns(); closeMobileMenu(); return; }
    if (!event.target.closest('.dropdown')) closeDropdowns();
    if (event.target.closest('#navigation a')) { closeMobileMenu(); closeDropdowns(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDropdowns(); closeMobileMenu(); }
  });
  $('mobile-menu').addEventListener('click', () => {
    const open = $('navigation').classList.toggle('open');
    $('mobile-menu').setAttribute('aria-expanded',String(open));
  });
  $('all-apps').addEventListener('click', () => {
    const show = $('extra-apps').hidden;
    $('extra-apps').hidden = !show;
    $('all-apps').setAttribute('aria-expanded',String(show));
    $('all-apps').textContent = show ? 'Ver menos apps' : 'Ver todas las apps';
  });

  function selectHero(key) {
    if (!tools[key]) return;
    heroTool = key;
    currentTool = key;
    const tool = tools[key];
    $('hero-title').textContent = tool.title;
    $('hero-description').textContent = tool.description;
    $('hero-icon').className = `fa-${tool.icon}`;
    $('hero-icon').style.color = tool.color;
    $('hero-input').placeholder = tool.placeholder;
    document.querySelector('.hero').style.backgroundColor = tool.hero;
    document.querySelectorAll('[data-platform]').forEach(button => {
      const selected = button.dataset.platform === key;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }
  $('start-form').addEventListener('submit', event => { event.preventDefault(); openDraw(heroTool,$('hero-input').value); });

  // Solo se almacenan los campos del formulario, sin credenciales ni conexiones.
  function readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft || typeof draft !== 'object') return;
      const strings = {participants:500000,'giveaway-title':100,excluded:500000,'range-from':30,'range-to':30};
      for (const [id,max] of Object.entries(strings)) if (typeof draft[id] === 'string') $(id).value = draft[id].slice(0,max);
      for (const id of ['winners-count','alternates-count']) if (typeof draft[id] === 'string' && /^\d{1,3}$/.test(draft[id])) $(id).value = draft[id];
      if (['0','3','5','10'].includes(draft['countdown-seconds'])) $('countdown-seconds').value = draft['countdown-seconds'];
      if (typeof draft['remove-duplicates'] === 'boolean') $('remove-duplicates').checked = draft['remove-duplicates'];
      inputMode = draft.mode === 'range' ? 'range' : 'manual';
    } catch (_) { /* El almacenamiento puede estar deshabilitado; el sorteo sigue funcionando. */ }
  }
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const data = {mode:inputMode};
      for (const id of ['participants','giveaway-title','excluded','range-from','range-to','winners-count','alternates-count','countdown-seconds']) data[id] = $(id).value;
      data['remove-duplicates'] = $('remove-duplicates').checked;
      try { localStorage.setItem(DRAFT_KEY,JSON.stringify(data)); $('draft-note').textContent = '✓ Borrador guardado en este navegador'; }
      catch (_) { $('draft-note').textContent = 'Borrador solo en esta sesión'; }
    },250);
  }
  readDraft();

  function setMode(mode) {
    inputMode = mode;
    $('list-entry').hidden = mode !== 'manual';
    $('range-entry').hidden = mode !== 'range';
    $('manual-mode').classList.toggle('selected',mode === 'manual');
    $('range-mode').classList.toggle('selected',mode === 'range');
    $('manual-mode').setAttribute('aria-pressed',String(mode === 'manual'));
    $('range-mode').setAttribute('aria-pressed',String(mode === 'range'));
    refreshCount();
    saveDraft();
  }
  function entriesFromForm() { return inputMode === 'range' ? engine.createRange($('range-from').value,$('range-to').value) : engine.parseEntries($('participants').value); }
  function error(id,message) { $(id).textContent = message || ''; $(id).hidden = !message; }
  function entryKey(value) { return value.normalize('NFKC').trim().toLocaleLowerCase('es'); }
  function refreshCount() {
    try {
      const entries = entriesFromForm();
      $('participant-total').textContent = entries.length.toLocaleString('es-MX');
      error('participants-error','');
      $('range-label').textContent = `${$('range-from').value || '?'} — ${$('range-to').value || '?'}`;
    } catch (err) { $('participant-total').textContent = '—'; error('participants-error',err.message); }
  }
  function stopDraw() {
    clearTimeout(timer);clearInterval(shuffleTimer);timer=null;shuffleTimer=null;busy=false;
    $('start-draw').disabled=false;$('repeat-draw').disabled=false;
  }
  function showScreen(screen) {
    activeScreen = screen;
    for (const name of ['participants','settings','drawing','results']) $(`screen-${name}`).hidden = name !== screen;
    const step = screen === 'participants' ? 1 : screen === 'settings' ? 2 : 3;
    document.querySelectorAll('[data-progress]').forEach(node => { const n = Number(node.dataset.progress);node.classList.toggle('active',n === step);node.classList.toggle('complete',n < step);if(n === step) node.setAttribute('aria-current','step');else node.removeAttribute('aria-current'); });
    $('draw-dialog').scrollTop=0;
  }
  function openDraw(key, seed) {
    if (!tools[key]) key='names';
    currentTool=key;
    stopDraw();
    $('draw-title').textContent=tools[key].title;
    if (key === 'coin') { $('participants').value='Cara\nCruz'; inputMode='manual'; }
    if (key === 'dice') { $('range-from').value='1';$('range-to').value='6';inputMode='range'; }
    if (key === 'numbers' && !$('participants').value.trim()) inputMode='range';
    if (seed && seed.trim()) {
      const text=seed.trim();
      if (/[\n,;]/.test(text) || /^-?\d+$/.test(text) || ['names','numbers','wheel'].includes(key)) { $('participants').value=text;inputMode='manual'; }
      else $('giveaway-title').value=(text.startsWith('@') ? 'Sorteo de '+text : text).slice(0,100);
    }
    setMode(inputMode);
    showScreen('participants');
    error('settings-error','');
    focusBeforeDialog=document.activeElement;
    $('draw-dialog').showModal();
    document.body.classList.add('dialog-open');
  }
  function closeDraw() { stopDraw();saveDraft();$('draw-dialog').close();document.body.classList.remove('dialog-open');if(focusBeforeDialog)focusBeforeDialog.focus(); }
  $('close-draw').addEventListener('click',closeDraw);
  $('draw-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDraw();});
  $('draw-dialog').addEventListener('click',event=>{if(event.target === $('draw-dialog')){const r=$('draw-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDraw();}});
  $('manual-mode').addEventListener('click',()=>setMode('manual'));
  $('range-mode').addEventListener('click',()=>setMode('range'));
  for (const id of ['participants','range-from','range-to']) $(id).addEventListener('input',()=>{refreshCount();saveDraft();});
  $('load-example').addEventListener('click',()=>{$('participants').value=currentTool==='names'?'Andrea\nCarlos\nDaniela\nDiego\nElena\nFernanda\nGabriel\nLucía\nMaría\nSantiago':'101\n205\n309\n412\n518\n624\n730\n845\n956\n1070';refreshCount();saveDraft();showToast('Lista de ejemplo cargada');});
  $('clear-draft').addEventListener('click',()=>{clearTimeout(draftTimer);try{localStorage.removeItem(DRAFT_KEY);}catch(_){}$('participants').value='';$('excluded').value='';$('giveaway-title').value='';$('range-from').value='1';$('range-to').value='100';$('winners-count').value='1';$('alternates-count').value='0';$('remove-duplicates').checked=true;$('countdown-seconds').value='5';inputMode='manual';setMode('manual');clearTimeout(draftTimer);$('draft-note').textContent='Borrador borrado';showToast('Borrador borrado de este navegador');});
  $('import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {
      if(file.size>500000)throw new Error('El archivo debe pesar menos de 500 KB.');
      const text=await file.text();engine.parseEntries(text);
      $('participants').value=text;setMode('manual');refreshCount();saveDraft();showToast('Lista importada');
    }catch(err){error('participants-error',err.message);}finally{event.target.value='';}
  });
  $('to-settings').addEventListener('click',()=>{
    try{const entries=entriesFromForm();if(!entries.length)throw new Error('Agrega al menos un participante para continuar.');error('participants-error','');if(!$('giveaway-title').value.trim())$('giveaway-title').value=tools[currentTool].title;refreshSummary();showScreen('settings');$('giveaway-title').focus();saveDraft();}
    catch(err){error('participants-error',err.message);}
  });
  $('back-to-participants').addEventListener('click',()=>showScreen('participants'));
  function refreshSummary() {
    try {
      prepared=engine.prepareEntries(entriesFromForm(),$('remove-duplicates').checked,$('excluded').value);
      for(const [id,value] of Object.entries({'summary-loaded':prepared.total,'summary-duplicates':prepared.duplicates,'summary-excluded':prepared.excludedCount,'summary-eligible':prepared.eligible.length}))$(id).textContent=value.toLocaleString('es-MX');
      error('settings-error','');return prepared;
    }catch(err){prepared=null;error('settings-error',err.message);return null;}
  }
  for(const id of ['remove-duplicates','excluded','winners-count','alternates-count','giveaway-title','countdown-seconds']) $(id).addEventListener('input',()=>{refreshSummary();saveDraft();});

  // El resultado se calcula una vez, antes de la animación. La animación solo lo revela.
  function startDraw() {
    if(busy)return;
    const data=refreshSummary();if(!data)return;
    try {
      const counts={winners:Number($('winners-count').value),alternates:Number($('alternates-count').value)};
      if(!$('winners-count').value || !$('alternates-count').value)throw new Error('Completa la cantidad de ganadores y suplentes.');
      const selected=engine.selectFixedWinners(data.eligible,counts.winners,counts.alternates);
      result={...selected,title:$('giveaway-title').value.trim()||tools[currentTool].title,total:data.eligible.length,date:new Date().toISOString(),tool:currentTool,deduplicated:$('remove-duplicates').checked};
      busy=true;$('start-draw').disabled=true;$('repeat-draw').disabled=true;
      showScreen('drawing');
      $('drawing-heading').textContent='Preparando el resultado...';
      $('drawing-method').hidden=true;
      const isWheel=currentTool==='wheel';$('live-wheel').hidden=!isWheel;
      if(isWheel){drawWheel(data.eligible,result.winners[0]);const winIndex=wheelEntries.indexOf(result.winners[0]);const segment=360/wheelEntries.length;const turns=1800+360-(winIndex+.5)*segment;$('wheel-canvas').style.transition='none';$('wheel-canvas').style.transform='rotate(0deg)';void $('wheel-canvas').offsetWidth;$('wheel-canvas').style.transition='transform 3s cubic-bezier(.13,.67,.1,1)';$('wheel-canvas').style.transform=`rotate(${turns}deg)`;}
      let remaining=Number($('countdown-seconds').value);
      if(isWheel)remaining=Math.max(3,remaining);
      $('countdown-number').textContent=String(remaining||'¡Listo!');
      $('shuffling-name').textContent=data.eligible[0];
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){remaining=0;}
      if(remaining===0){timer=setTimeout(revealResult,100);return;}
      shuffleTimer=setInterval(()=>{$('shuffling-name').textContent=data.eligible[engine.randomIndex(data.eligible.length)];},85);
      const tick=()=>{
        $('countdown-number').textContent=String(remaining);
        $('countdown-number').classList.remove('tick');void $('countdown-number').offsetWidth;$('countdown-number').classList.add('tick');
        timer=setTimeout(()=>{remaining--;if(remaining<=0)revealResult();else tick();},1000);
      };tick();
    } catch(err){stopDraw();error('settings-error',err.message);showScreen('settings');}
  }
  $('start-draw').addEventListener('click',startDraw);
  $('repeat-draw').addEventListener('click',startDraw);
  $('edit-draw').addEventListener('click',()=>{stopDraw();refreshSummary();showScreen('settings');});
  function revealResult() {
    stopDraw();if(!$('draw-dialog').open||!result)return;
    $('results-heading').textContent=result.winners.length===1?'¡Tenemos un ganador!':'¡Tenemos ganadores!';
    $('result-eyebrow').textContent='RESULTADO LISTO';
    $('result-title').textContent=result.title;
    if($('copy-fallback'))$('copy-fallback').remove();
    $('winners-list').replaceChildren();
    result.winners.forEach((name,index)=>{
      const card=document.createElement('div');card.className='winner-card'+(result.winners.length===1?' single':'');
      const rank=document.createElement('span');rank.className='winner-rank';rank.textContent=String(index+1);
      const text=document.createElement('div'),label=document.createElement('small'),winner=document.createElement('strong');
      label.textContent=result.winners.length===1?'Ganador':'Ganador '+(index+1);winner.textContent=name;text.append(label,winner);card.append(rank,text);$('winners-list').append(card);
    });
    $('alternates-section').hidden=result.alternates.length===0;$('alternates-list').replaceChildren();
    result.alternates.forEach(name=>{const li=document.createElement('li');li.textContent=name;$('alternates-list').append(li);});
    $('result-total').textContent=result.total.toLocaleString('es-MX')+' participantes elegibles';
    $('result-date').textContent=formatDate(result.date);
    showScreen('results');$('results-heading').focus({preventScroll:true});
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)confetti();
  }
  function formatDate(date){return new Date(date).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});}
  function confetti(){
    $('confetti').replaceChildren();
    for(let i=0;i<38;i++){const span=document.createElement('span');span.style.left=(i*37%100)+'%';span.style.background=COLORS[i%COLORS.length];span.style.setProperty('--delay',(i%9)*.09+'s');span.style.setProperty('--duration',(2.2+(i%7)*.2)+'s');$('confetti').append(span);}
  }
  function drawWheel(entries,winner){
    // En listas grandes se muestra una selección visual; el motor usa la lista completa.
    if(!entries.includes(winner))entries=[...entries,winner];
    wheelEntries=entries.length<=18?entries.slice():[winner,...entries.filter(value=>value!==winner).slice(0,17)];
    const canvas=$('wheel-canvas'),ctx=canvas.getContext('2d'),r=210;
    ctx.clearRect(0,0,420,420);
    const angle=2*Math.PI/wheelEntries.length;
    wheelEntries.forEach((name,i)=>{const start=-Math.PI/2+i*angle;ctx.beginPath();ctx.moveTo(r,r);ctx.arc(r,r,r-8,start,start+angle);ctx.closePath();ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(r,r);ctx.rotate(start+angle/2);ctx.textAlign='right';ctx.font='bold 17px Inter, Arial';ctx.fillStyle='white';ctx.fillText(name.length>15?name.slice(0,13)+'…':name,r-27,5);ctx.restore();});
    ctx.beginPath();ctx.arc(r,r,29,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle='#d21498';ctx.textAlign='center';ctx.font='bold 20px Arial';ctx.fillText('★',r,r+7);
  }

  // Exportaciones: texto seguro, CSV con protección de fórmulas y una imagen local.
  function resultText(){return `${result.title}\n\nGANADORES\n${result.winners.map((name,i)=>`${i+1}. ${name}`).join('\n')}${result.alternates.length?'\n\nSUPLENTES\n'+result.alternates.map((name,i)=>`${i+1}. ${name}`).join('\n'):''}\n\n${result.total} participantes elegibles\n${formatDate(result.date)}`;}
  function showToast(message){
    clearTimeout(toastTimer);document.querySelectorAll('.dialog-toast').forEach(x=>x.remove());
    const dialog=document.querySelector('dialog[open]');
    if(dialog){const toast=document.createElement('div');toast.className='dialog-toast';toast.setAttribute('role','status');toast.textContent=message;dialog.append(toast);toastTimer=setTimeout(()=>toast.remove(),3500);}
    else{$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},3500);}
  }
  $('copy-results').addEventListener('click',async()=>{
    if(!result)return;
    try{await navigator.clipboard.writeText(resultText());showToast('Resultado copiado');}
    catch(_){let box=$('copy-fallback');if(!box){box=document.createElement('textarea');box.id='copy-fallback';box.className='paste-fallback';box.setAttribute('aria-label','Resultado para copiar manualmente');box.readOnly=true;$('screen-results').append(box);}box.value=resultText();box.focus();box.select();showToast('Selecciona y copia el texto con Ctrl+C o ⌘C');}
  });
  function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  $('download-csv').addEventListener('click',()=>{
    if(!result)return;
    const cell=value=>{let text=String(value);if(/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
    const rows=[['Tipo','Puesto','Participante','Título','Fecha','Participantes elegibles']];
    result.winners.forEach((name,i)=>rows.push(['Ganador',i+1,name,result.title,result.date,result.total]));
    result.alternates.forEach((name,i)=>rows.push(['Suplente',i+1,name,result.title,result.date,result.total]));
    downloadBlob(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'resultado-sorteo.csv');showToast('CSV descargado');
  });
  function rounded(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function fitText(ctx,text,width){let value=text;if(ctx.measureText(value).width<=width)return value;while(value.length&&ctx.measureText(value+'…').width>width)value=value.slice(0,-1);return value+'…';}
  $('download-image').addEventListener('click',()=>{
    if(!result)return;
    try{
      const cols=result.winners.length>4?2:1,rows=Math.ceil(result.winners.length/cols),altsRows=Math.ceil(result.alternates.length/3);
      const height=350+rows*115+(result.alternates.length?80+altsRows*48:0)+45;
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=height;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fdf7fb';ctx.fillRect(0,0,1200,height);ctx.fillStyle='#ed2ba3';ctx.fillRect(0,0,1200,15);
      ctx.textAlign='center';ctx.font='700 26px Inter, Arial';ctx.fillStyle='#d21498';ctx.fillText('AppSorteos',600,95);
      ctx.font='900 52px Inter, Arial';ctx.fillStyle='#242034';ctx.fillText(result.winners.length===1?'¡Tenemos un ganador!':'¡Tenemos ganadores!',600,190);
      ctx.font='400 25px Inter, Arial';ctx.fillStyle='#8f788c';ctx.fillText(fitText(ctx,result.title,1000),600,250);
      ctx.font='400 18px Inter, Arial';ctx.fillStyle='#ad98a9';ctx.fillText(result.total+' participantes elegibles  ·  '+formatDate(result.date),600,295);
      const gap=22,pad=80,width=(1040-(cols-1)*gap)/cols;let y=350;
      result.winners.forEach((name,i)=>{const x=pad+(i%cols)*(width+gap),yy=y+Math.floor(i/cols)*115;rounded(ctx,x,yy,width,96,14,'#f8e4f1');ctx.textAlign='left';ctx.fillStyle='#be78a5';ctx.font='700 13px Inter, Arial';ctx.fillText('GANADOR '+(i+1),x+25,yy+28);ctx.fillStyle='#8e326f';ctx.font='700 '+(cols===1?34:27)+'px Inter, Arial';ctx.fillText(fitText(ctx,name,width-50),x+25,yy+69);});
      y+=rows*115;
      if(result.alternates.length){ctx.textAlign='center';ctx.font='700 22px Inter, Arial';ctx.fillStyle='#89718d';ctx.fillText('Suplentes',600,y+50);y+=80;result.alternates.forEach((name,i)=>{const x=80+(i%3)*354,yy=y+Math.floor(i/3)*48;rounded(ctx,x,yy,332,38,6,'#eee7f2');ctx.textAlign='left';ctx.font='400 17px Inter, Arial';ctx.fillStyle='#816d8a';ctx.fillText(fitText(ctx,(i+1)+'. '+name,305),x+13,yy+25);});}
      canvas.toBlob(blob=>{if(blob){downloadBlob(blob,'resultado-sorteo.png');showToast('Imagen descargada');}else showToast('No se pudo generar la imagen. Puedes descargar el CSV.');},'image/png');
    }catch(_){showToast('No se pudo generar la imagen. Puedes descargar el CSV.');}
  });

  const infoContent={
    account:{title:'Todo listo, sin crear una cuenta',text:'Esta recreación para clase funciona directamente en tu navegador. Tu lista se carga manualmente y el borrador se guarda en este dispositivo.\n\nPuedes comenzar un sorteo sin registrarte.'},
    prices:{title:'Tu práctica, sin suscripciones',text:'Todas las opciones de esta versión académica están disponibles sin pagos. Puedes cargar hasta 10,000 entradas y seleccionar hasta 100 ganadores y 100 suplentes.'},
    automation:{title:'Una lista lista para cada sorteo',text:'Esta práctica se concentra en el flujo manual: cargar participantes, configurar reglas y elegir ganadores. El borrador se conserva en este navegador para retomarlo después.'},
    project:{title:'Una práctica de programación',text:'Recreación independiente basada en la interfaz de AppSorteos para estudiar HTML, CSS y JavaScript.\n\nIncluye diseño adaptable, formularios, validación, almacenamiento local, selección aleatoria y exportación de resultados. La marca y los recursos de referencia pertenecen a AppSorteos.'},
    terms:{title:'Acerca del uso de esta práctica',text:'Proyecto académico independiente, sin afiliación con AppSorteos. Los sorteos se realizan localmente con la lista que ingreses. Los resultados descargados corresponden a esta práctica y no son certificados del servicio oficial.'},
    privacy:{title:'Tus participantes, en tu navegador',text:'Los participantes y la configuración se procesan en este dispositivo. El formulario no envía listas a servidores ni utiliza APIs de redes sociales.\n\nEl borrador se guarda en localStorage y puedes eliminarlo con Borrar borrador. La tipografía Inter puede cargarse desde Google Fonts.'}
  };
  function openInfo(key){const info=infoContent[key]||infoContent.project;$('info-title').textContent=info.title;$('info-content').textContent=info.text;$('info-dialog').showModal();document.body.classList.add('dialog-open');}
  function closeInfo(){$('info-dialog').close();if(!$('draw-dialog').open)document.body.classList.remove('dialog-open');}
  $('close-info').addEventListener('click',closeInfo);$('info-continue').addEventListener('click',closeInfo);$('info-dialog').addEventListener('cancel',event=>{event.preventDefault();closeInfo();});
  const previewAlts=['Selección de una publicación','Configuración de filtros','Selección de ganadores','Presentación del resultado'];
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{const step=Number(button.dataset.step);document.querySelectorAll('[data-step]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-expanded',String(active));});$('step-image').src=`assets/step-${step+1}.png`;$('step-image').alt='Ilustración del sitio de referencia: '+previewAlts[step];}));
  refreshCount();
})();

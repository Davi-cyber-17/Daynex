(function(){
  var $ = function(id){return document.getElementById(id)};
  var MS = 86400000, atual = null, timer = null, KEY = 'cd_eventos';

  function utc(y,m,d){var t=new Date(0);t.setUTCFullYear(y,m,d);t.setUTCHours(0,0,0,0);return t.getTime()}
  function parse(v){var p=v.split('-').map(Number);return utc(p[0],p[1]-1,p[2])}
  function hojeUTC(){var h=new Date();return utc(h.getFullYear(),h.getMonth(),h.getDate())}
  function localMeia(v){var p=v.split('-').map(Number),d=new Date(2000,0,1);d.setFullYear(p[0],p[1]-1,p[2]);d.setHours(0,0,0,0);return d.getTime()}
  function fmt(n){return n.toLocaleString('pt-BR')}
  function pl(n,s,p){return n===1?s:p}
  function dataLonga(t){return new Date(t).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function dias(v){return Math.round((parse(v)-hojeUTC())/MS)}

  function carregar(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return []}}
  function gravar(l){try{localStorage.setItem(KEY,JSON.stringify(l))}catch(e){}}
  var eventos = carregar();

  function temaAtual(){return document.documentElement.getAttribute('data-theme')==='light'?'light':'dark'}
  function rotuloTema(){$('tema').textContent=temaAtual()==='light'?'Modo escuro':'Modo claro'}
  rotuloTema();
  $('tema').onclick=function(){
    var novo=temaAtual()==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',novo);
    rotuloTema();
    try{localStorage.setItem('cd_tema',novo)}catch(e){}
  };

  document.querySelectorAll('.tab').forEach(function(b){
    b.onclick=function(){
      document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===b)});
      $('aba-contagem').classList.toggle('oculto',b.dataset.aba!=='contagem');
      $('aba-calc').classList.toggle('oculto',b.dataset.aba!=='calc');
      $('aba-natal').classList.toggle('oculto',b.dataset.aba!=='natal');
      document.body.classList.toggle('modo-natal',b.dataset.aba==='natal');
    };
  });

  function mostrar(ev){
    atual=ev;
    var n=dias(ev.data),a=Math.abs(n);
    $('hero').classList.remove('oculto');
    $('hero').classList.remove('pop');void $('hero').offsetWidth;$('hero').classList.add('pop');
    $('h-nome').textContent=ev.nome||'Data escolhida';
    $('h-data').textContent=dataLonga(parse(ev.data));
    if(n===0){$('h-num').textContent='Hoje!';$('h-leg').textContent='É hoje!'}
    else{
      $('h-num').textContent=fmt(a);
      $('h-leg').textContent=n>0?(a===1?'dia restante':'dias restantes'):(a===1?'dia desde essa data':'dias desde essa data');
    }
    $('h-num').classList.toggle('longo',$('h-num').textContent.length>6);
    $('h-nota').textContent=n>=0?'Contagem exata até 00h do dia escolhido':'Tempo exato desde 00h do dia escolhido';
    var cri=ev.criado,al=parse(ev.data);
    if(ev.criado!=null&&n>0&&al>cri){
      var pct=Math.max(0,Math.min(100,(hojeUTC()-cri)/(al-cri)*100));
      $('h-prog').classList.remove('oculto');
      $('h-bar').style.width=pct.toFixed(1)+'%';
      $('h-pct').textContent=pct.toFixed(0)+'% do caminho já percorrido desde que você salvou';
    }else $('h-prog').classList.add('oculto');
    $('salvar').textContent=achar(ev)>=0?'Salvo':'Salvar evento';
    tick();clearInterval(timer);timer=setInterval(tick,1000);
  }
  function tick(){
    if(!atual)return;
    var ms=Math.abs(localMeia(atual.data)-Date.now()),s=Math.floor(ms/1000);
    var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sc=s%60;
    $('r-d').textContent=fmt(d);$('r-h').textContent=h;$('r-m').textContent=m;$('r-s').textContent=sc;
  }
  function achar(ev){for(var i=0;i<eventos.length;i++)if(eventos[i].data===ev.data&&eventos[i].nome===ev.nome)return i;return -1}

  $('calcular').onclick=function(){
    if(!$('data').value){$('data').focus();return}
    mostrar({nome:$('nome').value.trim(),data:$('data').value,criado:hojeUTC()});
  };
  $('data').onchange=$('calcular').onclick;
  $('salvar-direto').onclick=function(){
    if(!$('data').value){$('data').focus();$('msg').textContent='Escolha uma data para salvar.';return}
    var ev={nome:$('nome').value.trim(),data:$('data').value,criado:hojeUTC()};
    var jaTem=achar(ev)>=0;
    if(!jaTem){eventos.push(ev);gravar(eventos);lista()}
    mostrar(ev);
    $('msg').textContent=jaTem?'Essa data já está salva.':'Data salva em Meus eventos.';
    setTimeout(function(){$('msg').textContent=''},2500);
  };
  $('salvar').onclick=function(){
    if(!atual||achar(atual)>=0)return;
    eventos.push(atual);gravar(eventos);lista();$('salvar').textContent='Salvo';
  };
  $('copiar').onclick=function(){
    if(!atual)return;
    var n=dias(atual.data),a=Math.abs(n);
    var t=(atual.nome||'A data')+': '+(n===0?'é hoje!':n>0?'faltam '+fmt(a)+' '+pl(a,'dia','dias'):'passaram-se '+fmt(a)+' '+pl(a,'dia','dias'))+' ('+new Date(parse(atual.data)).toLocaleDateString('pt-BR',{timeZone:'UTC'})+')';
    var ok=function(){$('copiar').textContent='Copiado!';setTimeout(function(){$('copiar').textContent='Copiar'},1500)};
    try{navigator.clipboard.writeText(t).then(ok,function(){window.prompt('Copie:',t)})}catch(e){window.prompt('Copie:',t)}
  };

  function lista(){
    var el=$('lista');
    if(!eventos.length){el.innerHTML='<div class="vazio">Nenhum evento salvo ainda. Calcule uma data e toque em Salvar evento.</div>';return}
    var ord=eventos.map(function(e,i){return {e:e,i:i,n:dias(e.data)}}).sort(function(a,b){
      var pa=a.n<0,pb=b.n<0;if(pa!==pb)return pa?1:-1;return pa?b.n-a.n:a.n-b.n});
    el.innerHTML=ord.map(function(o){
      var a=Math.abs(o.n),txt=o.n===0?'Hoje':fmt(a),sub=o.n===0?'':(o.n>0?pl(a,'dia','dias'):pl(a,'dia atrás','dias atrás'));
      return '<div class="ev" data-i="'+o.i+'"><div class="t"><b>'+esc(o.e.nome||'Sem nome')+'</b><small>'+new Date(parse(o.e.data)).toLocaleDateString('pt-BR',{timeZone:'UTC'})+'</small></div><div class="n">'+txt+'<small>'+sub+'</small></div><button class="x" data-x="'+o.i+'" type="button" aria-label="Remover">×</button></div>';
    }).join('');
  }
  $('lista').onclick=function(e){
    var x=e.target.closest('[data-x]');
    if(x){eventos.splice(+x.dataset.x,1);gravar(eventos);lista();if(atual)$('salvar').textContent=achar(atual)>=0?'Salvo':'Salvar evento';return}
    var c=e.target.closest('.ev');
    if(c){mostrar(eventos[+c.dataset.i]);window.scrollTo({top:0,behavior:'smooth'})}
  };

  function intervalo(a,b){
    var d1=new Date(Math.min(a,b)),d2=new Date(Math.max(a,b));
    var y=d2.getUTCFullYear()-d1.getUTCFullYear(),m=d2.getUTCMonth()-d1.getUTCMonth(),d=d2.getUTCDate()-d1.getUTCDate();
    if(d<0){m--;d+=new Date(Date.UTC(d2.getUTCFullYear(),d2.getUTCMonth(),0)).getUTCDate()}
    if(m<0){y--;m+=12}
    return [y,m,d];
  }
  function uteis(a,b){
    var ini=Math.min(a,b),fim=Math.max(a,b),total=Math.round((fim-ini)/MS),sem=Math.floor(total/7),c=sem*5,dia=new Date(ini).getUTCDay();
    for(var i=0;i<total%7;i++){var w=(dia+i)%7;if(w!==0&&w!==6)c++}
    return c;
  }
  $('c-ini').value=new Date().toISOString().slice(0,10);
  $('s-base').value=$('c-ini').value;
  $('c-go').onclick=function(){
    var i=$('c-ini').value,f=$('c-fim').value;
    if(!i||!f){$('c-res').innerHTML='<p class="erro">Preencha as duas datas.</p>';return}
    var a=parse(i),b=parse(f),t=Math.abs(Math.round((b-a)/MS)),r=intervalo(a,b);
    $('c-res').innerHTML='<div class="stats">'+
      '<div class="stat"><b>'+fmt(t)+'</b><small>'+pl(t,'dia','dias')+' no total</small></div>'+
      '<div class="stat"><b>'+fmt(uteis(a,b))+'</b><small>dias úteis (seg–sex)</small></div>'+
      '<div class="stat"><b>'+fmt(Math.floor(t/7))+'</b><small>semanas completas</small></div>'+
      '<div class="stat"><b>'+fmt(t*24)+'</b><small>horas</small></div></div>'+
      '<p class="nota" style="text-align:center">Ou seja: '+r[0]+' '+pl(r[0],'ano','anos')+', '+r[1]+' '+pl(r[1],'mês','meses')+' e '+r[2]+' '+pl(r[2],'dia','dias')+'</p>';
  };
  $('s-go').onclick=function(){
    var b=$('s-base').value,n=parseInt($('s-dias').value,10);
    if(!b||isNaN(n)){$('s-res').innerHTML='<p class="erro">Informe a data e a quantidade de dias.</p>';return}
    var r=parse(b)+n*MS;
    $('s-res').innerHTML='<div class="stat"><b style="font-size:1.25rem">'+dataLonga(r)+'</b><small>'+(n>=0?'daqui a ':'há ')+fmt(Math.abs(n))+' '+pl(Math.abs(n),'dia','dias')+' da data inicial</small></div>';
  };

  function natal(){
    var ano=new Date().getFullYear(),hoje=hojeUTC(),alvo=utc(ano,11,25);
    if(hoje>alvo){ano++;alvo=utc(ano,11,25)}
    var ant=utc(ano-1,11,25),n=Math.round((alvo-hoje)/MS);
    var ms=Math.max(0,localMeia(String(ano).padStart(4,'0')+'-12-25')-Date.now()),s=Math.floor(ms/1000);
    var d=Math.floor(s/86400),hr=Math.floor(s%86400/3600),mi=Math.floor(s%3600/60),sc=s%60;
    $('n-num').textContent=n===0?'Hoje!':fmt(n);
    $('n-leg').textContent=n===0?'Feliz Natal!':(n===1?'dia para o Natal':'dias para o Natal');
    $('n-data').textContent=dataLonga(alvo);
    $('n-d').textContent=fmt(d);$('n-h').textContent=hr;$('n-m').textContent=mi;$('n-s').textContent=sc;
    var pct=Math.max(0,Math.min(100,(hoje-ant)/(alvo-ant)*100));
    $('n-bar').style.width=pct.toFixed(1)+'%';
    $('n-pct').textContent=pct.toFixed(0)+'% do caminho desde o Natal anterior';
    $('n-stats').innerHTML=
      '<div class="stat"><b>'+fmt(Math.floor(n/7))+'</b><small>semanas completas</small></div>'+
      '<div class="stat"><b>'+fmt(uteis(hoje,alvo))+'</b><small>dias úteis (seg–sex)</small></div>'+
      '<div class="stat"><b>'+fmt(Math.floor(s/3600))+'</b><small>horas</small></div>'+
      '<div class="stat"><b>'+(n/30.44).toFixed(1).replace('.',',')+'</b><small>meses</small></div>';
  }
  var nv=document.querySelector('#aba-natal .neve');
  for(var i=0;i<45;i++){
    var f=document.createElement('i'),t=2+Math.random()*4;
    f.style.cssText='left:'+(Math.random()*100)+'%;width:'+t+'px;height:'+t+'px;opacity:'+(.4+Math.random()*.5)+';animation-duration:'+(8+Math.random()*10)+'s;animation-delay:-'+(Math.random()*14)+'s;--dx:'+((Math.random()*60)-30)+'px';
    nv.appendChild(f);
  }
  natal();setInterval(natal,1000);

  lista();
})();

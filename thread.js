/* happypet thread */
(function () {
  if (window.__threadLoaded) return;
  window.__threadLoaded = true;
  var NS = 'http://www.w3.org/2000/svg';
  var st = document.createElement('style');
  st.textContent = '#thread-layer{position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:40;overflow:visible}#thread-layer svg{position:absolute;left:0;top:0;overflow:visible}@media(max-width:760px){#thread-layer{display:none!important}}';
  document.head.appendChild(st);
  var layer = document.createElement('div');
  layer.id = 'thread-layer';
  layer.setAttribute('aria-hidden','true');
  var svg = document.createElementNS(NS,'svg');
  layer.appendChild(svg);
  document.body.insertBefore(layer,document.body.firstChild);
  if(getComputedStyle(document.body).position==='static')document.body.style.position='relative';
  var p = document.createElementNS(NS,'path');
  p.setAttribute('fill','none');
  p.setAttribute('stroke-linecap','round');
  p.setAttribute('stroke-linejoin','round');
  svg.appendChild(p);
  var L=0;
  function build(){
    var W=document.documentElement.clientWidth;
    var H=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    svg.setAttribute('width',W);svg.setAttribute('height',H);
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    layer.style.height=H+'px';
    p.setAttribute('stroke','var(--primary)');
    p.setAttribute('stroke-width','2');
    p.setAttribute('opacity','0.7');
    var sels=['.hero','#about','#services','#doctors','#tips','#location'];
    var ys=[];
    sels.forEach(function(s){
      var el=document.querySelector(s);
      if(!el)return;
      var r=el.getBoundingClientRect();
      ys.push(r.top+window.scrollY+r.height*0.5);
    });
    if(ys.length<2)return;
    var mL=W*0.1,mR=W*0.9;
    var d='M '+mR+' '+(ys[0]-80);
    var side=1;
    for(var i=0;i<ys.length-1;i++){
      var ya=ys[i],yb=ys[i+1],dy=yb-ya;
      var ax=side>0?mR:mL,bx=side>0?mL:mR;
      var ld=side>0?-1:1;
      var ly=ya+dy*0.35,lr=Math.min(60,dy*0.12);
      d+=' C '+ax+' '+(ya+dy*0.1)+' '+ax+' '+(ly-lr*2)+' '+ax+' '+ly;
      d+=' C '+(ax+ld*lr*2.5)+' '+(ly+lr*0.8)+' '+(ax+ld*lr*2.5)+' '+(ly-lr*1.8)+' '+ax+' '+(ly-lr*0.3);
      d+=' C '+(ax+ld*lr*0.3)+' '+(ly+lr)+' '+bx+' '+(yb-dy*0.1)+' '+bx+' '+yb;
      side*=-1;
    }
    p.setAttribute('d',d);
    L=p.getTotalLength();
    p.setAttribute('stroke-dasharray',L);
    p.setAttribute('stroke-dashoffset',L);
    draw();
  }
  function draw(){
    if(!L)return;
    var H=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    var max=H-window.innerHeight;
    if(max<=0)return;
    var prog=Math.max(0,Math.min(1,window.scrollY/max));
    p.setAttribute('stroke-dashoffset',L-(L*prog));
  }
  var tick=false;
  window.addEventListener('scroll',function(){
    if(tick)return;tick=true;
    requestAnimationFrame(function(){draw();tick=false;});
  },{passive:true});
  window.addEventListener('resize',function(){setTimeout(build,200);},{passive:true});
  build();
  window.addEventListener('load',build);
  [500,1500,3000].forEach(function(t){setTimeout(build,t);});
  document.addEventListener('image-slot:filled',build);
})();

(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const stockData = [
    {symbol:"RELIANCE",name:"Reliance Industries",sector:"Energy",category:"energy",price:1428.00,change:1.24,color:"#e6f4ee",initial:"R",popular:1},
    {symbol:"HDFCBANK",name:"HDFC Bank",sector:"Banking",category:"banking",price:1764.35,change:0.82,color:"#e8efff",initial:"H",popular:2},
    {symbol:"TCS",name:"Tata Consultancy Services",sector:"IT",category:"it",price:3982.50,change:-0.34,color:"#e9e8ff",initial:"T",popular:3},
    {symbol:"INFY",name:"Infosys",sector:"IT",category:"it",price:1542.80,change:1.16,color:"#e1f1ff",initial:"I",popular:4},
    {symbol:"ICICIBANK",name:"ICICI Bank",sector:"Banking",category:"banking",price:1286.20,change:0.57,color:"#fff0df",initial:"I",popular:5},
    {symbol:"BHARTIARTL",name:"Bharti Airtel",sector:"Telecom",category:"popular",price:1968.75,change:1.91,color:"#ffe9e8",initial:"A",popular:6},
    {symbol:"TATAMOTORS",name:"Tata Motors",sector:"Auto",category:"auto",price:684.40,change:-1.08,color:"#e8f5f1",initial:"T",popular:7},
    {symbol:"SBIN",name:"State Bank of India",sector:"Banking",category:"banking",price:812.65,change:0.43,color:"#e8efff",initial:"S",popular:8},
    {symbol:"ITC",name:"ITC Limited",sector:"FMCG",category:"popular",price:433.90,change:-0.21,color:"#fff2dd",initial:"I",popular:9},
    {symbol:"LT",name:"Larsen & Toubro",sector:"Infrastructure",category:"popular",price:3628.00,change:0.69,color:"#e7f0ff",initial:"L",popular:10},
    {symbol:"MARUTI",name:"Maruti Suzuki",sector:"Auto",category:"auto",price:12420.00,change:0.38,color:"#e8f5f1",initial:"M",popular:11},
    {symbol:"ONGC",name:"Oil & Natural Gas Corp.",sector:"Energy",category:"energy",price:276.30,change:-0.62,color:"#e6f4ee",initial:"O",popular:12}
  ];
  const state = {filter:"all",view:"explore",query:"",selected:"RELIANCE",range:"1D",chartType:"line",sort:"popular",watchlist:loadWatchlist()};
  function loadWatchlist(){try{return JSON.parse(localStorage.getItem("thiruExploreWatchlist")||"[]").filter(x=>stockData.some(s=>s.symbol===x));}catch(_){return [];}}
  function saveWatchlist(){try{localStorage.setItem("thiruExploreWatchlist",JSON.stringify(state.watchlist));}catch(_){toast("Could not save watchlist in this browser.");}}
  const money = n => "₹"+Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2300);}
  function stockBySymbol(symbol){return stockData.find(s=>s.symbol===symbol)||stockData[0];}
  async function connectMarketData(){
    try{
      const response=await fetch("/api/market",{headers:{"Accept":"application/json"}});
      if(!response.ok)throw new Error("Market API is not available");
      const payload=await response.json();
      if(payload.mode!=="live"||!payload.prices)throw new Error("Backend is in demo mode");
      let updated=0;
      stockData.forEach(stock=>{
        const price=Number(payload.prices[stock.symbol]);
        if(Number.isFinite(price)&&price>0){stock.price=price;updated++;}
        const change=Number(payload.changes?.[stock.symbol]);
        if(Number.isFinite(change))stock.change=change;
      });
      if(payload.indices?.NIFTY)document.querySelector(".index-card:nth-child(1)>strong").textContent=money(payload.indices.NIFTY);
      if(payload.indices?.SENSEX)document.querySelector(".index-card:nth-child(2)>strong").textContent=money(payload.indices.SENSEX);
      [["NIFTY","niftyChange"],["SENSEX","sensexChange"]].forEach(([key,id])=>{
        const value=Number(payload.index_changes?.[key]);
        if(Number.isFinite(value)){
          const el=$("#"+id);el.className="index-change "+(value>=0?"positive":"negative");
          el.textContent=(value>=0?"+":"")+value.toFixed(2)+"% day change";
        }
      });
      if(updated || Object.keys(payload.indices||{}).length){
        const fullCoverage=updated===stockData.length && Boolean(payload.indices?.NIFTY) && Boolean(payload.indices?.SENSEX);
        $("#dataModeBadge").innerHTML=fullCoverage?"<i></i> LIVE DATA":"<i></i> PARTIAL DATA";
        $("#dataModeBadge").classList.toggle("live",fullCoverage);
        $("#marketStatus").innerHTML=fullCoverage
          ?'<span class="pulse live-pulse"></span> Live Groww API data'
          :'<span class="pulse"></span> Partial quotes · some demo values may remain';
        renderRows();renderChart();renderPaper();updateTicket();
      }
    }catch(_){
      $("#dataModeBadge").innerHTML="<i></i> DEMO DATA";
      $("#marketStatus").innerHTML='<span class="pulse"></span> Demo snapshot · API not connected';
    }
  }
  function visibleStocks(){
    let list=stockData.filter(s=>(state.view!=="watchlist"||state.watchlist.includes(s.symbol))&&(state.filter==="all"||state.filter==="popular"?state.filter==="all"||s.popular<=6||s.category==="popular":s.category===state.filter));
    const q=state.query.trim().toLowerCase();
    if(q) list=list.filter(s=>(s.name+" "+s.symbol+" "+s.sector).toLowerCase().includes(q));
    if(state.sort==="change")list.sort((a,b)=>b.change-a);
    else if(state.sort==="priceHigh")list.sort((a,b)=>b.price-a.price);
    else if(state.sort==="priceLow")list.sort((a,b)=>a.price-b.price);
    else if(state.sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
    else list.sort((a,b)=>a.popular-b.popular);
    return list;
  }
  function renderRows(){
    const list=visibleStocks();
    $("#stockRows").innerHTML=list.map(s=>`<tr class="stock-row ${state.selected===s.symbol?"selected":""}" data-symbol="${s.symbol}" tabindex="0" role="button" aria-label="View ${escapeHTML(s.name)}">
      <td><div class="stock-company"><span class="company-logo" style="background:${s.color}">${escapeHTML(s.initial)}</span><span><strong>${escapeHTML(s.name)}</strong><small>${s.symbol} <i>·</i> ${escapeHTML(s.sector)}</small></span></div></td>
      <td class="price-cell">${money(s.price)}</td>
      <td><span class="change-pill ${s.change>=0?"positive":"negative"}">${s.change>=0?"+":""}${s.change.toFixed(2)}%</span></td>
      <td><svg class="mini-chart" viewBox="0 0 94 30" aria-label="Sample trend">${miniChart(s)}</svg></td>
      <td><button class="watch-button ${state.watchlist.includes(s.symbol)?"is-watched":""}" data-watch="${s.symbol}" aria-label="${state.watchlist.includes(s.symbol)?"Remove from":"Add to"} watchlist" title="Toggle watchlist">${state.watchlist.includes(s.symbol)?"★":"☆"}</button></td>
    </tr>`).join("");
    $("#noResults").hidden=list.length>0;
    $(".table-scroll").style.display=list.length?"block":"none";
    $("#resultCount").textContent=`Showing ${list.length} of ${stockData.length} sample stocks`;
    $("#watchCount").textContent=String(state.watchlist.length);
    $("#listTitle").textContent=state.view==="watchlist"?"My watchlist":"Popular stocks";
    $("#pageTitle").textContent=state.view==="watchlist"?"My watchlist":"Explore stocks";
  }
  function miniChart(s){
    const values=Array.from({length:14},(_,i)=>25+(Math.sin(i*1.17+s.popular)*5)+(i*0.35)+Math.sin(i*2.2+s.popular)*3+(s.change<0?-i*.8:i*.35));
    const min=Math.min(...values),max=Math.max(...values);
    const pts=values.map((v,i)=>`${i*7.1+1},${27-(v-min)/(max-min||1)*23}`).join(" ");
    return `<polyline points="${pts}" fill="none" stroke="${s.change>=0?"#00a86b":"#e45d65"}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function chartPath(seed,range){
    const count=80,rangeFactor={"1D":1,"1W":1.6,"1M":2.1,"1Y":3.2}[range]||1;
    let value=0.48+(seed%4)*0.025;const values=[];
    for(let i=0;i<count;i++){value+=Math.sin(i*.28+seed)*.012*rangeFactor+Math.cos(i*.11+seed*.7)*.009+(i>count*.55?.0015:-.0003);value=Math.max(.12,Math.min(.88,value));values.push(value);}
    return values.map((v,i)=>[i/(count-1)*800,190-v*165]);
  }
  function renderChart(){
    const s=stockBySymbol(state.selected),points=chartPath(s.popular,state.range);
    const path=points.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
    const line=$("#chartLine"),area=$("#chartArea"),svg=$("#priceChart");
    line.setAttribute("d",path);line.setAttribute("stroke",s.change>=0?"#00a86b":"#e45d65");
    area.setAttribute("d",path+" L 800 220 L 0 220 Z");
    area.setAttribute("fill",s.change>=0?"url(#chartFill)":"url(#chartFill)");
    let candles=svg.querySelector("#candleLayer");
    if(!candles){candles=document.createElementNS("http://www.w3.org/2000/svg","g");candles.setAttribute("id","candleLayer");svg.appendChild(candles);}
    candles.innerHTML="";
    if(state.chartType==="candle"){
      line.style.display="none";area.style.display="none";
      const ns="http://www.w3.org/2000/svg";
      const vals=points.map((p,i)=>p[1]+Math.sin(i*.91+s.popular)*7+Math.cos(i*.37)*4);
      for(let i=1;i<points.length;i++){
        const x=points[i][0],prev=vals[i-1],cur=vals[i],open=Math.min(210,Math.max(10,prev)),close=Math.min(210,Math.max(10,cur));
        const high=Math.max(8,Math.min(open,close)-4-Math.abs(Math.sin(i*1.31))*9),low=Math.min(215,Math.max(open,close)+4+Math.abs(Math.cos(i*.73))*8),up=cur<prev,color=up?"#e45d65":"#00a878";
        const wick=document.createElementNS(ns,"line");wick.setAttribute("x1",x);wick.setAttribute("x2",x);wick.setAttribute("y1",high);wick.setAttribute("y2",low);wick.setAttribute("stroke",color);wick.setAttribute("stroke-width","1.3");candles.appendChild(wick);
        const body=document.createElementNS(ns,"rect");body.setAttribute("x",x-2.2);body.setAttribute("y",Math.min(open,close));body.setAttribute("width","4.4");body.setAttribute("height",Math.max(2,Math.abs(close-open)));body.setAttribute("fill",color);body.setAttribute("rx",".5");candles.appendChild(body);
      }
    }else{line.style.display="";area.style.display="";candles.innerHTML="";}
    $("#detailLogo").textContent=s.initial;$("#detailLogo").style.background=s.color;
    $("#detailName").textContent=s.name;$("#detailMeta").textContent=s.symbol+" · "+s.sector+" · Sample quote";
    $("#detailPrice").textContent=money(s.price);
    $("#detailChange").textContent=(s.change>=0?"+":"")+s.change.toFixed(2)+"%";
    $("#detailChange").className=s.change>=0?"positive":"negative";
    $("#watchSelected").textContent=(state.watchlist.includes(s.symbol)?"★ In watchlist":"☆ Add to watchlist");
    $("#watchSelected").classList.toggle("watched",state.watchlist.includes(s.symbol));
    $("#chartStart").textContent=state.range==="1D"?"09:15":state.range==="1W"?"Mon":"Start";
    $("#chartMiddle").textContent=state.range==="1D"?"12:00":state.range==="1W"?"Wed":"Mid";
    $("#chartEnd").textContent=state.range==="1D"?"15:30":state.range==="1W"?"Fri":"Latest";
    document.querySelectorAll(".time-tab").forEach(b=>b.classList.toggle("active",b.dataset.range===state.range));
    document.querySelectorAll(".chart-type-tab").forEach(b=>b.classList.toggle("active",b.dataset.chartType===state.chartType));
  }
  function toggleWatch(symbol){
    if(state.watchlist.includes(symbol)){state.watchlist=state.watchlist.filter(x=>x!==symbol);toast("Removed from watchlist");}
    else{state.watchlist.push(symbol);toast("Added to watchlist");}
    saveWatchlist();renderRows();renderChart();
  }
  document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{
    state.view=button.dataset.view;
    document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b===button));
    renderRows();
    if(state.view==="watchlist")$("#detailSection").scrollIntoView({behavior:"smooth",block:"nearest"});
  }));
  document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{
    state.filter=button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b===button));
    state.view="explore";document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view==="explore"));
    renderRows();
  }));

  // Local-only paper account: never sends orders to any broker.
  const DEMO_KEY="thiruPaperAccountV1";
  let paper=loadPaper();
  let tradeSide="BUY";
  function loadPaper(){try{const p=JSON.parse(localStorage.getItem(DEMO_KEY)||"null");if(p&&Number.isFinite(p.cash)&&Array.isArray(p.holdings)&&Array.isArray(p.positions)&&Array.isArray(p.orders))return p;}catch(_){}return {cash:100000,holdings:[],positions:[],orders:[],funds:[]};}
  function savePaper(){try{localStorage.setItem(DEMO_KEY,JSON.stringify(paper));}catch(_){toast("Could not save paper account in this browser.");}}
  const fmtQty=n=>Number(n).toLocaleString("en-IN",{maximumFractionDigits:4});
  function currentPrice(symbol){return Number(stockBySymbol(symbol).price)||0;}
  function showEmpty(id,cols,msg){$(id).innerHTML='<tr><td class="table-empty" colspan="'+cols+'">'+msg+'</td></tr>';}
  function renderPaper(){
    $("#demoCash").textContent=money(paper.cash);
    const holdings=paper.holdings.filter(x=>x.qty>0);
    $("#holdingsRows").innerHTML=holdings.length?holdings.map(x=>{const p=currentPrice(x.symbol),value=p*x.qty,pnl=value-x.qty*x.avg;return '<tr><td>'+escapeHTML(stockBySymbol(x.symbol).name)+'<br><small>'+x.symbol+'</small></td><td>'+fmtQty(x.qty)+'</td><td>'+money(x.avg)+'</td><td>'+money(value)+'</td><td class="'+(pnl>=0?"positive":"negative")+'">'+(pnl>=0?"+":"")+money(pnl)+'</td></tr>';}).join(""):(showEmpty("#holdingsRows",5,"No demo holdings yet. Buy a delivery stock in the Trade tab to start."),"");
    $("#positionsRows").innerHTML=paper.positions.length?paper.positions.map((x,i)=>{const p=currentPrice(x.symbol),pnl=(p-x.avg)*x.qty;return '<tr><td>'+escapeHTML(stockBySymbol(x.symbol).name)+'<br><small>'+x.symbol+' · Intraday</small></td><td>'+fmtQty(x.qty)+'</td><td>'+money(x.avg)+'</td><td>'+money(p)+'</td><td class="'+(pnl>=0?"positive":"negative")+'">'+(pnl>=0?"+":"")+money(pnl)+'</td><td><button class="row-action" data-close-position="'+i+'">Close</button></td></tr>';}).join(""):(showEmpty("#positionsRows",6,"No open intraday demo positions."),"");
    $("#ordersRows").innerHTML=paper.orders.length?paper.orders.slice().reverse().map(o=>'<tr><td>'+escapeHTML(o.time)+'</td><td>'+escapeHTML(stockBySymbol(o.symbol).name)+'<br><small>'+o.symbol+'</small></td><td>'+o.side+' · '+o.product+'</td><td>'+fmtQty(o.qty)+'</td><td>'+money(o.price)+'</td><td><span class="status-pill '+(o.status==="REJECTED"?"rejected":"")+'">'+o.status+'</span></td></tr>').join(""): (showEmpty("#ordersRows",6,"No orders yet. Your demo order history will appear here."),"");
    const watch=state.watchlist.map(symbol=>stockBySymbol(symbol));
    $("#watchlistCards").innerHTML=watch.length?watch.map(s=>'<div class="watchlist-stock" data-watch-card="'+s.symbol+'"><strong>'+escapeHTML(s.name)+'</strong><small>'+s.symbol+' · '+escapeHTML(s.sector)+'</small><b>'+money(s.price)+'</b><small class="'+(s.change>=0?"positive":"negative")+'">'+(s.change>=0?"+":"")+s.change.toFixed(2)+'%</small></div>').join(""):'<p class="panel-hint">Your watchlist is empty. Use the ☆ beside a stock to save it.</p>';
  }
  function updateTicket(){const symbol=$("#tradeSymbol").value,p=currentPrice(symbol),qty=Math.floor(Number($("#tradeQty").value)||0);$("#ticketPrice").textContent=money(p);$("#orderValue").textContent=money(p*Math.max(0,qty));$("#placePaperOrder").textContent="Place demo "+(tradeSide==="BUY"?"buy":"sell")+" order";$("#placePaperOrder").classList.toggle("sell-order",tradeSide==="SELL");}
  function findHolding(symbol){return paper.holdings.find(x=>x.symbol===symbol);}
  function addOrder(symbol,side,product,qty,price,status){paper.orders.push({symbol,side,product,qty,price,status,time:new Date().toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})});if(paper.orders.length>200)paper.orders.shift();}
  function executePaperOrder(){
    const symbol=$("#tradeSymbol").value,product=$("#tradeProduct").value,qty=Math.floor(Number($("#tradeQty").value)||0),price=currentPrice(symbol),value=qty*price;
    if(!Number.isInteger(qty)||qty<1||qty>100000){toast("Enter a whole-number quantity between 1 and 100,000.");return;}
    if(!(price>0)){toast("No usable reference price for this stock.");return;}
    if(tradeSide==="BUY"){
      if(value>paper.cash){addOrder(symbol,tradeSide,product,qty,price,"REJECTED");savePaper();renderPaper();toast("Demo order rejected: insufficient cash.");return;}
      paper.cash-=value;
      if(product==="DELIVERY"){let h=findHolding(symbol);if(h){h.avg=(h.avg*h.qty+price*qty)/(h.qty+qty);h.qty+=qty;}else paper.holdings.push({symbol,qty,avg:price});}
      else paper.positions.push({symbol,qty,avg:price});
      addOrder(symbol,tradeSide,product,qty,price,"COMPLETED");
      toast("Demo buy completed. No real order was placed.");
    }else{
      if(product==="DELIVERY"){
        const h=findHolding(symbol);
        if(!h||h.qty<qty){addOrder(symbol,tradeSide,product,qty,price,"REJECTED");savePaper();renderPaper();toast("Demo sell rejected: not enough delivery holdings.");return;}
        h.qty-=qty;paper.cash+=value;paper.holdings=paper.holdings.filter(x=>x.qty>0);
      }else{
        const idx=paper.positions.findIndex(x=>x.symbol===symbol&&x.qty>=qty);
        if(idx<0){addOrder(symbol,tradeSide,product,qty,price,"REJECTED");savePaper();renderPaper();toast("Demo sell rejected: no matching intraday position.");return;}
        const pos=paper.positions[idx];pos.qty-=qty;paper.cash+=value;if(pos.qty===0)paper.positions.splice(idx,1);
      }
      addOrder(symbol,tradeSide,product,qty,price,"COMPLETED");
      toast("Demo sell completed. No real order was placed.");
    }
    savePaper();renderPaper();
  }

  document.querySelectorAll("[data-workspace-link]").forEach(link=>link.addEventListener("click",e=>{
    e.preventDefault();
    const panel=link.dataset.workspaceLink;
    document.querySelectorAll(".workspace-tab").forEach(b=>b.classList.toggle("active",b.dataset.panel===panel));
    document.querySelectorAll(".workspace-panel").forEach(p=>p.classList.toggle("active",p.id===panel));
    document.querySelectorAll(".subnav a").forEach(a=>a.classList.toggle("active",a===link));
    $("#traderWorkspace").scrollIntoView({behavior:"smooth",block:"start"});
    renderPaper();
  }));

  document.querySelectorAll(".workspace-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".workspace-tab").forEach(b=>b.classList.toggle("active",b===button));document.querySelectorAll(".workspace-panel").forEach(p=>p.classList.toggle("active",p.id===button.dataset.panel));if(button.dataset.panel==="watchlistPanel")renderPaper();}));
  document.querySelectorAll(".subnav [data-view='watchlist']").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".workspace-tab").forEach(b=>b.classList.toggle("active",b.dataset.panel==="watchlistPanel"));document.querySelectorAll(".workspace-panel").forEach(p=>p.classList.toggle("active",p.id==="watchlistPanel"));$("#traderWorkspace").scrollIntoView({behavior:"smooth"});renderPaper();}));
  document.querySelectorAll(".groww-tabs a[href='#mutual-funds']").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".workspace-tab").forEach(b=>b.classList.toggle("active",b.dataset.panel==="fundsPanel"));document.querySelectorAll(".workspace-panel").forEach(p=>p.classList.toggle("active",p.id==="fundsPanel"));$("#traderWorkspace").scrollIntoView({behavior:"smooth"});}));
  $("#tradeSymbol").addEventListener("change",updateTicket);$("#tradeQty").addEventListener("input",updateTicket);
  document.querySelectorAll("[data-side]").forEach(button=>button.addEventListener("click",()=>{tradeSide=button.dataset.side;document.querySelectorAll("[data-side]").forEach(b=>b.classList.toggle("active",b===button));updateTicket();}));
  $("#placePaperOrder").addEventListener("click",executePaperOrder);
  $("#resetDemo").addEventListener("click",()=>{if(!window.confirm("Reset demo cash, holdings, positions and order history? This cannot be undone."))return;paper={cash:100000,holdings:[],positions:[],orders:[],funds:[]};savePaper();renderPaper();toast("Demo account reset.");});
  $("#clearOrders").addEventListener("click",()=>{paper.orders=[];savePaper();renderPaper();toast("Demo order history cleared.");});
  $("#positionsRows").addEventListener("click",e=>{const b=e.target.closest("[data-close-position]");if(!b)return;const i=Number(b.dataset.closePosition),pos=paper.positions[i];if(!pos)return;paper.cash+=pos.qty*currentPrice(pos.symbol);addOrder(pos.symbol,"CLOSE","INTRADAY",pos.qty,currentPrice(pos.symbol),"COMPLETED");paper.positions.splice(i,1);savePaper();renderPaper();toast("Intraday demo position closed.");});
  $("#watchlistCards").addEventListener("click",e=>{const card=e.target.closest("[data-watch-card]");if(!card)return;state.selected=card.dataset.watchCard;renderChart();$("#detailSection").scrollIntoView({behavior:"smooth"});});
  document.querySelectorAll("[data-fund]").forEach(button=>button.addEventListener("click",()=>{const name=button.dataset.fund;if(!paper.funds.includes(name))paper.funds.push(name);savePaper();$("#fundLearningList").textContent="Learning list: "+paper.funds.join(" · ");toast("Added to your mutual fund learning list.");}));
  document.querySelectorAll("[data-quick-stock]").forEach(button=>button.addEventListener("click",()=>{state.selected=button.dataset.quickStock;state.view="explore";renderRows();renderChart();$("#detailSection").scrollIntoView({behavior:"smooth",block:"start"});}));
  $("#stockSearch").addEventListener("input",e=>{state.query=e.target.value;renderRows();});
  $("#searchForm").addEventListener("submit",e=>e.preventDefault());
  $("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderRows();});
  $("#stockRows").addEventListener("click",e=>{
    const watch=e.target.closest("[data-watch]");
    if(watch){e.stopPropagation();toggleWatch(watch.dataset.watch);return;}
    const row=e.target.closest("[data-symbol]");if(row){state.selected=row.dataset.symbol;renderRows();renderChart();$("#detailSection").scrollIntoView({behavior:"smooth",block:"nearest"});}
  });
  $("#stockRows").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-symbol]")){e.preventDefault();state.selected=e.target.dataset.symbol;renderRows();renderChart();}});
  $("#watchSelected").addEventListener("click",()=>toggleWatch(state.selected));
  document.querySelectorAll("[data-range]").forEach(b=>b.addEventListener("click",()=>{state.range=b.dataset.range;renderChart();}));
  document.querySelectorAll("[data-chart-type]").forEach(b=>b.addEventListener("click",()=>{state.chartType=b.dataset.chartType;renderChart();}));
  $("#clearSearch").addEventListener("click",()=>{$("#stockSearch").value="";state.query="";state.filter="all";state.view="explore";document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view==="explore"));renderRows();});
  document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#stockSearch").focus();}});
  document.querySelectorAll("[data-spark]").forEach((el,i)=>{const values=Array.from({length:22},(_,n)=>16+Math.sin(n*.8+i)*5+n*.42+Math.cos(n*1.9)*2);const min=Math.min(...values),max=Math.max(...values);const pts=values.map((v,n)=>`${n*4.5},${31-(v-min)/(max-min)*27}`).join(" ");el.innerHTML=`<svg viewBox="0 0 96 34" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#00a86b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;});
  renderRows();renderChart();renderPaper();updateTicket();connectMarketData();
  window.setInterval(connectMarketData, 15000);
})();
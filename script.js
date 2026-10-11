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
  const state = {filter:"all",view:"explore",query:"",selected:"RELIANCE",range:"1D",sort:"popular",watchlist:loadWatchlist()};
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
      if(updated){
        $("#dataModeBadge").innerHTML="<i></i> LIVE API";
        $("#dataModeBadge").classList.add("live");
        $("#marketStatus").innerHTML='<span class="pulse live-pulse"></span> Live Groww API data';
        renderRows();renderChart();
        toast("Connected to Groww market data.");
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
    $("#chartLine").setAttribute("d",path);
    $("#chartArea").setAttribute("d",path+" L 800 220 L 0 220 Z");
    $("#chartLine").setAttribute("stroke",s.change>=0?"#00a86b":"#e45d65");
    $("#chartArea").setAttribute("fill",s.change>=0?"url(#chartFill)":"url(#chartFill)");
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
  $("#clearSearch").addEventListener("click",()=>{$("#stockSearch").value="";state.query="";state.filter="all";state.view="explore";document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view==="explore"));renderRows();});
  document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#stockSearch").focus();}});
  document.querySelectorAll("[data-spark]").forEach((el,i)=>{const values=Array.from({length:22},(_,n)=>16+Math.sin(n*.8+i)*5+n*.42+Math.cos(n*1.9)*2);const min=Math.min(...values),max=Math.max(...values);const pts=values.map((v,n)=>`${n*4.5},${31-(v-min)/(max-min)*27}`).join(" ");el.innerHTML=`<svg viewBox="0 0 96 34" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#00a86b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;});
  renderRows();renderChart();
})();
(()=>{"use strict";
const stocks=[
 {symbol:"RELIANCE",name:"Reliance Industries",sector:"Energy",exchange:"NSE",tv:"NSE:RELIANCE"},
 {symbol:"HDFCBANK",name:"HDFC Bank",sector:"Banking",exchange:"NSE",tv:"NSE:HDFCBANK"},
 {symbol:"TCS",name:"Tata Consultancy Services",sector:"IT",exchange:"NSE",tv:"NSE:TCS"},
 {symbol:"INFY",name:"Infosys",sector:"IT",exchange:"NSE",tv:"NSE:INFY"},
 {symbol:"ICICIBANK",name:"ICICI Bank",sector:"Banking",exchange:"NSE",tv:"NSE:ICICIBANK"},
 {symbol:"BHARTIARTL",name:"Bharti Airtel",sector:"Telecom",exchange:"NSE",tv:"NSE:BHARTIARTL"},
 {symbol:"TATAMOTORS",name:"Tata Motors",sector:"Auto",exchange:"NSE",tv:"NSE:TATAMOTORS"},
 {symbol:"SBIN",name:"State Bank of India",sector:"Banking",exchange:"NSE",tv:"NSE:SBIN"},
 {symbol:"ITC",name:"ITC Limited",sector:"FMCG",exchange:"NSE",tv:"NSE:ITC"},
 {symbol:"LT",name:"Larsen & Toubro",sector:"Infrastructure",exchange:"NSE",tv:"NSE:LT"},
 {symbol:"ONGC",name:"Oil & Natural Gas Corporation",sector:"Energy",exchange:"NSE",tv:"NSE:ONGC"},
 {symbol:"MARUTI",name:"Maruti Suzuki",sector:"Auto",exchange:"NSE",tv:"NSE:MARUTI"},
 {symbol:"SUNPHARMA",name:"Sun Pharmaceutical",sector:"Pharma",exchange:"NSE",tv:"NSE:SUNPHARMA"},
 {symbol:"WIPRO",name:"Wipro",sector:"IT",exchange:"NSE",tv:"NSE:WIPRO"},
 {symbol:"AXISBANK",name:"Axis Bank",sector:"Banking",exchange:"NSE",tv:"NSE:AXISBANK"},
 {symbol:"BAJFINANCE",name:"Bajaj Finance",sector:"Banking",exchange:"NSE",tv:"NSE:BAJFINANCE"}
];
const $=id=>document.getElementById(id),money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
let selected="RELIANCE",watch=[];
const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v===null?fallback:v}catch{return fallback}};
watch=read("thiruTradeWatch",[]);
const safeText=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function renderRows(){
 const q=$("search").value.trim().toLowerCase(),sector=$("sectorFilter").value,exchange=$("exchangeFilter").value;
 const a=stocks.filter(s=>(sector==="all"||s.sector===sector)&&(exchange==="all"||s.exchange===exchange)&&(s.name+" "+s.symbol+" "+s.sector).toLowerCase().includes(q));
 $("stockRows").innerHTML=a.map(s=>'<tr data-symbol="'+s.symbol+'" class="'+(selected===s.symbol?"selected":"")+'"><td><strong>'+s.name+'</strong><small>'+s.symbol+'</small></td><td>'+s.sector+'</td><td><button class="mini-button" data-chart="'+s.symbol+'">Open chart</button></td><td><button class="watch-btn" data-watch="'+s.symbol+'" aria-label="Toggle '+s.symbol+' watchlist">'+(watch.includes(s.symbol)?"★":"☆")+'</button></td></tr>').join("");
 $("empty").hidden=a.length>0;$("stockCount").textContent="Showing "+a.length+" listed-equity symbols · prices are not fabricated or shown as quotes";
}
function renderWatch(){
 const list=$("watchlist");
 if(!watch.length){list.innerHTML='<p class="muted">No saved stocks yet. Add a symbol from the explorer.</p>';return}
 list.innerHTML=watch.map(sym=>{const s=stocks.find(x=>x.symbol===sym);return s?'<button class="watch-chip" data-select="'+s.symbol+'"><strong>'+s.symbol+'</strong><span>'+s.name+'</span><span aria-hidden="true">↗</span></button>':""}).join("");
}
function loadChart(){
 const s=stocks.find(x=>x.symbol===selected)||stocks[0];
 $("detailName").textContent=s.name;$("detailMeta").textContent=s.symbol+" · "+s.sector+" · "+s.exchange;
 $("toggleWatch").textContent=watch.includes(s.symbol)?"★ In watchlist":"☆ Add to watchlist";
 $("chartStatus").textContent="Connecting to TradingView chart…";
 const host=$("tradingview-chart");host.replaceChildren();
 if(!window.TradingView){
   $("chartStatus").textContent="Chart provider is loading or unavailable. Check your connection, then reload.";
   const retry=document.createElement("button");retry.className="button secondary";retry.textContent="Retry chart";retry.addEventListener("click",loadChart);host.appendChild(retry);return;
 }
 try{
   new window.TradingView.widget({autosize:true,symbol:s.tv,interval:"15",timezone:"Asia/Kolkata",theme:"dark",style:"1",locale:"en",enable_publishing:false,allow_symbol_change:false,hide_side_toolbar:false,hide_top_toolbar:false,save_image:false,calendar:false,details:true,hotlist:false,show_popup_button:true,container_id:"tradingview-chart"});
   $("chartStatus").textContent="Chart loaded from TradingView · verify exchange and timestamp there.";
 }catch(e){$("chartStatus").textContent="Unable to load chart. Check connection and try another symbol."}
}
function toggle(sym){watch=watch.includes(sym)?watch.filter(x=>x!==sym):watch.concat(sym);try{localStorage.setItem("thiruTradeWatch",JSON.stringify(watch))}catch{}renderRows();renderWatch();loadChart()}
$("search").addEventListener("input",renderRows);$("sectorFilter").addEventListener("change",renderRows);$("exchangeFilter").addEventListener("change",renderRows);
$("stockRows").addEventListener("click",e=>{const b=e.target.closest("[data-watch]");if(b){e.stopPropagation();toggle(b.dataset.watch);return}const tr=e.target.closest("[data-symbol]");if(tr){selected=tr.dataset.symbol;renderRows();loadChart()}});
$("watchlist").addEventListener("click",e=>{const b=e.target.closest("[data-select]");if(b){selected=b.dataset.select;renderRows();loadChart()}});
$("toggleWatch").addEventListener("click",()=>toggle(selected));
function calc(){
 const capital=Math.max(0,Number($("capital").value)||0),risk=Math.min(5,Math.max(0,Number($("risk").value)||0)),entry=Math.max(0,Number($("entry").value)||0),stop=Math.max(0,Number($("stop").value)||0),budget=capital*risk/100;
 $("riskBudget").textContent=money(budget);
 if(entry<=0||stop<=0||stop>=entry){$("quantity").textContent="Enter entry above stop-loss";$("positionValue").textContent="—";return}
 const byRisk=Math.floor(budget/(entry-stop)),byCapital=Math.floor(capital/entry),qty=Math.max(0,Math.min(byRisk,byCapital));
 $("quantity").textContent=qty.toLocaleString("en-IN")+" shares";
 $("positionValue").textContent=money(qty*entry);
}
["capital","risk","entry","stop"].forEach(id=>$(id).addEventListener("input",calc));
function checkSetup(){
 const p=Number($("marketPrice").value),f=Number($("emaFast").value),s=Number($("emaSlow").value),r=Number($("rsi").value),vol=$("volumeConfirm").checked;
 const result=$("signalResult");
 if(![$("marketPrice").value,$("emaFast").value,$("emaSlow").value,$("rsi").value].every(v=>v.trim()!=="")||![p,f,s,r].every(Number.isFinite)||p<=0||f<=0||s<=0||r<0||r>100){
  result.className="signal-result neutral";result.innerHTML="<strong>Inputs needed</strong><p>Enter positive price and EMA values and an RSI between 0 and 100. Values must come from a verified chart.</p>";return
 }
 const checks=[p>f,f>s,r>=50&&r<=70,vol],passed=checks.filter(Boolean).length;
 const names=["Price above EMA 9","EMA 9 above EMA 21","RSI between 50 and 70","Volume above recent average"];
 result.className="signal-result "+(passed===4?"positive":passed>=2?"caution":"neutral");
 result.innerHTML="<strong>"+(passed===4?"All rules passed — candidate setup":passed>=2?"Partial setup — not all rules passed":"Setup does not meet the rule set")+"</strong><p>"+passed+" of 4 conditions passed. This is a rule-check result, not a forecast or instruction to buy/sell.</p><ul>"+names.map((n,i)=>"<li>"+(checks[i]?"✓":"—")+" "+n+"</li>").join("")+"</ul>";
}
$("checkSetup").addEventListener("click",checkSetup);
function getJournal(){return read("thiruTradeJournal",[])}
function renderJournal(){
 const list=getJournal(),host=$("journalList");
 if(!list.length){host.innerHTML='<p class="muted">Your saved notes will appear here.</p>';return}
 host.innerHTML=list.slice(0,10).map(n=>'<article class="journal-entry"><div><strong>'+safeText(n.symbol)+'</strong><span>'+safeText(n.setup||"Plan")+' · '+safeText(n.savedAt||"")+'</span></div><p>'+safeText(n.reason)+'</p><small>Risk / exit: '+safeText(n.exit)+'</small></article>').join("");
}
$("saveJournal").addEventListener("click",()=>{
 const note={symbol:$("journalSymbol").value.trim().toUpperCase(),setup:$("journalSetup").value,reason:$("journalReason").value.trim(),exit:$("journalExit").value.trim(),savedAt:new Date().toLocaleString("en-IN")};
 if(!note.symbol||!note.reason||!note.exit){$("journalStatus").textContent="Fill in symbol, entry reason and risk/exit plan first.";return}
 const list=getJournal();list.unshift(note);
 try{localStorage.setItem("thiruTradeJournal",JSON.stringify(list.slice(0,50)));$("journalStatus").textContent="Saved locally on this browser.";renderJournal()}
 catch{$("journalStatus").textContent="Browser storage unavailable; note was not saved."}
});
$("clearJournal").addEventListener("click",()=>{if(!window.confirm("Clear all locally saved journal notes from this browser?"))return;try{localStorage.removeItem("thiruTradeJournal");renderJournal();$("journalStatus").textContent="Local journal cleared."}catch{$("journalStatus").textContent="Could not clear browser storage."}});
const tv=document.createElement("script");tv.src="https://s3.tradingview.com/tv.js";tv.async=true;tv.onload=loadChart;tv.onerror=()=>{$("chartStatus").textContent="TradingView script did not load. Check your connection or content blocker."};document.head.appendChild(tv);
renderRows();renderWatch();calc();renderJournal();
})();
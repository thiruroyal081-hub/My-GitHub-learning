(()=>{"use strict";
const stocks=[
 {symbol:"RELIANCE",name:"Reliance Industries",sector:"Energy",price:1428,change:1.24,exchange:"NSE/BSE"},
 {symbol:"HDFCBANK",name:"HDFC Bank",sector:"Banking",price:1764.35,change:.82,exchange:"NSE/BSE"},
 {symbol:"TCS",name:"Tata Consultancy Services",sector:"IT",price:3982.5,change:-.34,exchange:"NSE/BSE"},
 {symbol:"INFY",name:"Infosys",sector:"IT",price:1542.8,change:1.16,exchange:"NSE/BSE"},
 {symbol:"ICICIBANK",name:"ICICI Bank",sector:"Banking",price:1286.2,change:.57,exchange:"NSE/BSE"},
 {symbol:"BHARTIARTL",name:"Bharti Airtel",sector:"Telecom",price:1968.75,change:1.91,exchange:"NSE/BSE"},
 {symbol:"TATAMOTORS",name:"Tata Motors",sector:"Auto",price:684.4,change:-1.08,exchange:"NSE/BSE"},
 {symbol:"SBIN",name:"State Bank of India",sector:"Banking",price:812.65,change:.43,exchange:"NSE/BSE"},
 {symbol:"ITC",name:"ITC Limited",sector:"FMCG",price:433.9,change:-.21,exchange:"NSE/BSE"},
 {symbol:"LT",name:"Larsen & Toubro",sector:"Infrastructure",price:3628,change:.69,exchange:"NSE/BSE"},
 {symbol:"ONGC",name:"Oil & Natural Gas Corp.",sector:"Energy",price:276.3,change:-.62,exchange:"NSE/BSE"},
 {symbol:"MARUTI",name:"Maruti Suzuki",sector:"Auto",price:12420,change:.38,exchange:"NSE/BSE"}
];
const $=id=>document.getElementById(id),money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
let selected="RELIANCE",watch=[];try{watch=JSON.parse(localStorage.getItem("thiruTradeWatch")||"[]")}catch{}
function renderRows(){let q=$("search").value.trim().toLowerCase(),sector=$("sectorFilter").value,sort=$("sortBy").value;let a=stocks.filter(s=>(sector==="all"||s.sector===sector)&&(s.name+" "+s.symbol+" "+s.sector).toLowerCase().includes(q));if(sort==="priceHigh")a.sort((x,y)=>y.price-x.price);if(sort==="priceLow")a.sort((x,y)=>x.price-y.price);if(sort==="change")a.sort((x,y)=>y.change-x.change);if(sort==="name")a.sort((x,y)=>x.name.localeCompare(y.name));$("stockRows").innerHTML=a.map(s=>'<tr data-symbol="'+s.symbol+'" class="'+(selected===s.symbol?"selected":"")+'"><td><strong>'+s.name+'</strong><small>'+s.symbol+' · '+s.sector+'</small></td><td>'+money(s.price)+'</td><td class="change '+(s.change>=0?"up":"down")+'">'+(s.change>=0?"+":"")+s.change.toFixed(2)+'%</td><td>'+s.exchange+'</td><td><button class="watch-btn" data-watch="'+s.symbol+'" aria-label="Toggle '+s.symbol+' watchlist">'+(watch.includes(s.symbol)?"★":"☆")+'</button></td></tr>').join("");$("empty").hidden=a.length>0;$("stockCount").textContent="Showing "+a.length+" illustrative stocks · sample values only"}
function renderDetail(){let s=stocks.find(x=>x.symbol===selected)||stocks[0];$("detailName").textContent=s.name;$("detailMeta").textContent=s.symbol+" · "+s.sector+" · NSE/BSE";$("detailPrice").textContent=money(s.price);$("detailChange").textContent=(s.change>=0?"+":"")+s.change.toFixed(2)+"%";$("detailChange").className=s.change>=0?"up":"down";$("toggleWatch").textContent=(watch.includes(s.symbol)?"★ In watchlist":"☆ Add to watchlist");let pts=[];for(let i=0;i<45;i++){let v=83+Math.sin(i*.27+s.price)*13+Math.cos(i*.12)*8+i*.12;pts.push([i*500/44,150-v])}let d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");$("chartLine").setAttribute("d",d);$("chartArea").setAttribute("d",d+" L 500 180 L 0 180 Z")}
function toggle(sym){watch=watch.includes(sym)?watch.filter(x=>x!==sym):watch.concat(sym);try{localStorage.setItem("thiruTradeWatch",JSON.stringify(watch))}catch{}renderRows();renderDetail()}
$("search").addEventListener("input",renderRows);$("sectorFilter").addEventListener("change",renderRows);$("sortBy").addEventListener("change",renderRows);
$("stockRows").addEventListener("click",e=>{let b=e.target.closest("[data-watch]");if(b){e.stopPropagation();toggle(b.dataset.watch);return}let tr=e.target.closest("[data-symbol]");if(tr){selected=tr.dataset.symbol;renderRows();renderDetail()}});
$("toggleWatch").addEventListener("click",()=>toggle(selected));
function calc(){let capital=Math.max(0,Number($("capital").value)||0),risk=Math.min(5,Math.max(0,Number($("risk").value)||0)),entry=Math.max(0,Number($("entry").value)||0),stop=Math.max(0,Number($("stop").value)||0),budget=capital*risk/100,diff=Math.abs(entry-stop);$("riskBudget").textContent=money(budget);$("quantity").textContent=diff>0&&entry>0?Math.floor(budget/diff).toLocaleString("en-IN")+" shares":"Enter valid entry and stop prices"}
["capital","risk","entry","stop"].forEach(id=>$(id).addEventListener("input",calc));
$("saveJournal").addEventListener("click",()=>{let note={symbol:$("journalSymbol").value.trim().toUpperCase(),reason:$("journalReason").value.trim(),exit:$("journalExit").value.trim(),savedAt:new Date().toLocaleString()};if(!note.symbol||!note.reason||!note.exit){$("journalStatus").textContent="Fill in the symbol, entry reason and risk/exit plan first.";return}try{let list=JSON.parse(localStorage.getItem("thiruTradeJournal")||"[]");list.unshift(note);localStorage.setItem("thiruTradeJournal",JSON.stringify(list.slice(0,30)));$("journalStatus").textContent="Saved locally on this browser at "+note.savedAt+"."}catch{$("journalStatus").textContent="Browser storage is unavailable; note was not saved."}});
renderRows();renderDetail();calc();
})();
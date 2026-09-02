const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..') + '/';
function node(){const classes=new Set();const handlers={};return {textContent:'',innerHTML:'',value:'featured',dataset:{},handlers,style:{},attrs:{},classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,b){if(b)classes.add(x);else classes.delete(x)}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},appendChild(){},querySelectorAll(){return []},querySelector(){return null},addEventListener(k,cb){handlers[k]=cb},scrollIntoView(){},focus(){},remove(){}}}
function env(lang='es',name='properties',fail=false){
 const nodes={},events={};const get=id=>nodes[id]??=node();
 const grid=get('vrGridAll');grid.id='vrGridAll';
 const location={search:'',pathname:`/${lang==='en'?'en/':''}${name}.html`};
 const document={documentElement:{lang},body:node(),getElementById:get,querySelectorAll:sel=>sel==='[data-vr-grid]'?[grid]:[],querySelector:()=>null,addEventListener:(k,cb)=>{(events[k]??=[]).push(cb)},createElement:node};
 const ctx={document,location,URLSearchParams,console:{error(){}},matchMedia:()=>({matches:true}),fetch:async path=>{if(fail)throw Error('offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync(root+path.slice(1),'utf8'))}}};ctx.window=ctx;
 vm.createContext(ctx);
 const execute=name=>vm.runInContext(fs.readFileSync(root+`js/${name}.js`,'utf8'),ctx);
 execute('listings');
 return {ctx,nodes,get,events,execute};
}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 for(const lang of ['es','en']){
  const sale=JSON.parse(fs.readFileSync(root+`assets/data/properties${lang==='en'?'-en':''}.json`));
  const rental=JSON.parse(fs.readFileSync(root+`assets/data/vacation-rentals${lang==='en'?'-en':''}.json`));
  assert.equal(sale.length,10);assert.equal(rental.length,2);assert(!rental.some(p=>/perla/i.test(p.slug)));
  const loft=sale.find(p=>p.id===11);assert.equal(loft.priceCRC,68000000);assert.equal(loft.currency,'CRC');assert.equal(loft.lotSize,null);
  let e=env(lang);const api=e.ctx.NaturaListings;
  const card=api.card(loft);assert(card.includes('fa-bed'));assert(card.includes('fa-bath'));assert(!card.includes('null'));assert(!card.includes('undefined'));assert(!card.includes('0 m²'));assert(!card.includes('fa-user-group'));
  const land=api.card(sale[0]);assert(land.includes('fa-ruler-combined'));assert(!land.includes('fa-bed'));
  assert(api.card(rental[0],{kind:'rental'}).includes('fa-user-group'));
  assert(api.card({...loft,title:'<script>alert(1)</script>'}).includes('&lt;script&gt;'));
  assert(api.metadata({bedrooms:0,bathrooms:null,lotSize:null})==='');
  e.execute('properties');await tick();assert.equal(e.nodes.resultsCount.textContent,10);assert.equal((e.nodes.propertiesGrid.innerHTML.match(/class="listing-card/g)||[]).length,9);assert(e.nodes.propertiesGrid.innerHTML.includes(loft.slug));assert(e.nodes.pagination.innerHTML.includes('data-page="2"'));
  e.nodes.pagination.handlers.click({target:{closest:()=>({dataset:{page:'2'}})}});assert.equal((e.nodes.propertiesGrid.innerHTML.match(/class="listing-card/g)||[]).length,1);
  e.nodes.sortBy.value='price-low';e.nodes.sortBy.handlers.change();const cheapest=[...sale].sort((a,b)=>(Number(a.price)>0?Number(a.price):Number(a.priceCRC)/525)-(Number(b.price)>0?Number(b.price):Number(b.priceCRC)/525))[0];assert(e.nodes.propertiesGrid.innerHTML.includes('slug='+cheapest.slug));assert(e.nodes.propertiesGrid.innerHTML.indexOf('slug='+cheapest.slug)<e.nodes.propertiesGrid.innerHTML.indexOf('listing-media'));assert(e.nodes.pagination.innerHTML.includes('aria-current="page"'));
  e=env(lang,'index');e.execute('home');await tick();assert.equal((e.nodes.featuredGrid.innerHTML.match(/class="listing-card/g)||[]).length,3);assert(e.nodes.featuredGrid.innerHTML.includes(loft.slug));assert.equal(e.nodes.activePropertyCount.textContent,sale.filter(p=>!api.sold(p)).length);
  e=env(lang,'vacation-rentals');e.execute('vacation-rentals');await tick();assert.equal(e.nodes.statCount.textContent,2);assert.equal((e.nodes.vrGridAll.innerHTML.match(/class="listing-card/g)||[]).length,2);assert(e.nodes.vrGridAll.classList.contains('listings-grid--pair'));
  for(const slug of rental.map(p=>p.slug)){
   e=env(lang,'vacation-rental');e.ctx.location.search='?slug='+slug;e.execute('vacation-rental');e.events.DOMContentLoaded.forEach(cb=>cb());await tick();assert.equal(e.nodes.vrTitle.textContent,rental.find(p=>p.slug===slug).title);assert(e.nodes.vrRelatedGrid.innerHTML.includes('listing-card'));assert(!e.nodes.vrRelatedGrid.innerHTML.includes('loft-la-perla'));
  }
  for(const name of ['properties','home','vacation-rentals']){
   e=env(lang,name,true);e.execute(name);await tick();const id={properties:'propertiesGrid',home:'featuredGrid','vacation-rentals':'vrGridAll'}[name];assert(e.nodes[id].innerHTML.includes('role="alert"'));
  }
 }
 console.log('PASS: 2 languages; 10 sales + 2 rentals; loft price/category; shared cards; correct icons; unknown-data omission; safe text; sale sorting/pagination; featured selection; related rentals; network-error states.');
})().catch(e=>{console.error(e);process.exit(1)});

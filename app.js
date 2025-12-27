const API='https://www.themealdb.com/api/json/v1/1';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

let REGIONS,RULES;
let pantry=[];
let allergies=[];

fetch('./data/regions.json').then(r=>r.json()).then(d=>{
REGIONS=d.regions;
REGIONS.forEach(r=>regionSelect.add(new Option(r.label,r.id)));
renderQuick(REGIONS[0]);
regionSelect.onchange=()=>renderQuick(REGIONS.find(x=>x.id===regionSelect.value));
});

fetch('./data/rules.json').then(r=>r.json()).then(d=>{
RULES=d;
RULES.diets.forEach(diet=>{
const b=document.createElement('button');
b.className='seg'+(diet.id==='omnivore'?' active':'');
b.textContent=diet.label;
b.onclick=()=>selectDiet(diet.id,b);
dietTabs.appendChild(b);
});
RULES.allergies.forEach(a=>allergySelect.add(new Option(a.label,a.id)));
});

function selectDiet(id,btn){
$$('#dietTabs .seg').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
dietInput.value=id;
}

function renderQuick(region){
quickPantry.innerHTML='';
(region.staples||[]).forEach(i=>{
const b=document.createElement('button');
b.className='btn';
b.textContent='+ '+i;
b.onclick=()=>addPantry(i);
quickPantry.appendChild(b);
});
}

function addPantry(item){
if(item && !pantry.includes(item)){
pantry.push(item);
renderPantry();
}
}

pantryInput.addEventListener('keydown',e=>{
if(e.key==='Enter'){
e.preventDefault();
addPantry(pantryInput.value.trim().toLowerCase());
pantryInput.value='';
}
});

function renderPantry(){
pantryChips.innerHTML='';
pantry.forEach(i=>{
const c=document.createElement('span');
c.className='chip';
c.textContent=i+' ✕';
c.onclick=()=>{pantry=pantry.filter(x=>x!==i);renderPantry();};
pantryChips.appendChild(c);
});
}

addAllergy.onclick=()=>{
if(allergySelect.value && !allergies.includes(allergySelect.value)){
allergies.push(allergySelect.value);
const c=document.createElement('span');
c.className='chip';
c.textContent=allergySelect.value;
allergyChips.appendChild(c);
}
};

btnRecipe.onclick=async()=>{
const r=await fetch(API+'/random.php').then(r=>r.json());
const m=r.meals[0];
const ingredients=[];
for(let i=1;i<=20;i++){if(m['strIngredient'+i])ingredients.push(m['strIngredient'+i].toLowerCase());}

const have=ingredients.filter(i=>pantry.includes(i));
const need=ingredients.filter(i=>!pantry.includes(i));

recipeBox.innerHTML=`
<h3>${m.strMeal}</h3>
<img src="${m.strMealThumb}">
<div class="have">✅ You already have: ${have.join(', ')||'nothing yet'}</div>
<div class="need">🛒 You need: ${need.join(', ')}</div>
`;
recipeCard.hidden=false;
};

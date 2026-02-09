const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = localStorage.getItem("familyId");
const USER_ID = localStorage.getItem("userId");

let people = [];
let dataReady = false;

fetch(API_URL +
 "?action=getTree" +
 "&familyId=" + FAMILY_ID +
 "&userId=" + USER_ID)
  .then(r => r.json())
  .then(res => {
    if(res.status === "OK"){
      people = res.data;
      dataReady = true;
      fillDropdowns();
      console.log("Loaded", people.length, "members");
    }
  });

function fillDropdowns(){
  const A = document.getElementById("personAList");
  const B = document.getElementById("personBList");

  A.innerHTML = "";
  B.innerHTML = "";

  people.forEach(p=>{
    A.innerHTML +=
      `<div class="dropdownItem"
         onclick="selectPerson('A','${p.personId}','${p.name}')">
         ${p.name}
       </div>`;

    B.innerHTML +=
      `<div class="dropdownItem"
         onclick="selectPerson('B','${p.personId}','${p.name}')">
         ${p.name}
       </div>`;
  });
}

function openDropdown(type){
  document.getElementById("personADrop").style.display = "none";
  document.getElementById("personBDrop").style.display = "none";

  document.getElementById("person"+type+"Drop").style.display = "block";
}

function selectPerson(type,id,name){
  document.getElementById("person"+type+"Input").value = name;
  document.getElementById("person"+type+"Input").dataset.id = id;
  document.getElementById("person"+type+"Drop").style.display = "none";
}

function filterPerson(type,value){
  value = value.toLowerCase();

  const items =
    document.querySelectorAll("#person"+type+"List .dropdownItem");

  items.forEach(i=>{
    if(i.innerText.toLowerCase().includes(value)){
      i.style.display = "block";
    }else{
      i.style.display = "none";
    }
  });
}

function checkRelation(){
  const a = document.getElementById("personAInput").dataset.id;
const b = document.getElementById("personBInput").dataset.id;

  const res = findRelation(a, b);
  document.getElementById("result").innerText = res;
}

function getAncestorLevel(childId, ancestorId){

  let level = 0;
  let current = people.find(p => p.personId === childId);

  while(current){

    if(current.fatherId === ancestorId ||
       current.motherId === ancestorId){
      return level + 1;
    }

    // move one level up (prefer father, else mother)
    current =
      people.find(p =>
        p.personId === current.fatherId ||
        p.personId === current.motherId
      );

    level++;

    if(level > 10) break; // safety
  }

  return 0;
}

function getPerson(id){
  return people.find(p => p.personId === id);
}

function getFather(p){
  return getPerson(p.fatherId);
}

function getMother(p){
  return getPerson(p.motherId);
}

function areSiblings(A,B){
  return (
    A.personId !== B.personId &&
    (
      (A.fatherId && A.fatherId === B.fatherId) ||
      (A.motherId && A.motherId === B.motherId)
    )
  );
}

function findRelation(a, b){

  if(!dataReady || !people.length){
    return "Data still loading. Try again.";
  }

  const A = people.find(p => p.personId === a);
  const B = people.find(p => p.personId === b);

  if(!A || !B) return "Relation not found";
  if(a === b) return "Same person";

  // Spouse
  if(
  String(A.spouseId || "").split(",").includes(B.personId) ||
  String(B.spouseId || "").split(",").includes(A.personId)
){
  return `${A.name} is spouse of ${B.name}`;
}

  // Siblings
  if(
  (A.fatherId && A.fatherId === B.fatherId) ||
  (A.motherId && A.motherId === B.motherId)
){
  return `${A.name} is ${
    A.gender === "Female" ? "sister" : "brother"
  } of ${B.name}`;
}
 // UNCLE / AUNT
const A_father = getFather(A);
const A_mother = getMother(A);

if(A_father && areSiblings(A_father, B)){
  return `${B.name} is uncle/aunt of ${A.name}`;
}

if(A_mother && areSiblings(A_mother, B)){
  return `${B.name} is uncle/aunt of ${A.name}`;
}
 //Reverse check 
 if(B_father && areSiblings(B_father, A)){
  return `${A.name} is uncle/aunt of ${B.name}`;
}

if(B_mother && areSiblings(B_mother, A)){
  return `${A.name} is uncle/aunt of ${B.name}`;
}
//Nepew/niece
 if(A_father && areSiblings(A, B_father)){
  return `${A.name} is nephew/niece of ${B.name}`;
}

if(A_mother && areSiblings(A, B_mother)){
  return `${A.name} is nephew/niece of ${B.name}`;
}
 //cousin 
 if(
  A_father && B_father &&
  areSiblings(A_father, B_father)
){
  return `${A.name} and ${B.name} are cousins`;
}

if(
  A_mother && B_mother &&
  areSiblings(A_mother, B_mother)
){
  return `${A.name} and ${B.name} are cousins`;
}
 // Cousin return
 if(A_father && B_father &&
   areSiblings(A_father, B_father)){
  return `${A.name} and ${B.name} are paternal cousins`;
}

if(A_mother && B_mother &&
   areSiblings(A_mother, B_mother)){
  return `${A.name} and ${B.name} are maternal cousins`;
}

  // Father / Mother
 if(B.fatherId === A.personId || B.motherId === A.personId){
  return `${A.name} is ${
    A.gender === "Female" ? "mother" : "father"
  } of ${B.name}`;
} 

  // Son / Daughter
  if(A.fatherId === B.personId || A.motherId === B.personId){
  return `${A.name} is ${
    A.gender === "Female" ? "daughter" : "son"
  } of ${B.name}`;
}

  // Grandparent
  const A_father = people.find(p => p.personId === A.fatherId);
  const A_mother = people.find(p => p.personId === A.motherId);

  if(A_father && A_father.fatherId === B.personId){
    return `${A.name} is grandson of ${B.name}`;
  }
  if(A_mother && A_mother.motherId === B.personId){
    return `${A.name} is granddaughter of ${B.name}`;
  }
 // ---------- ANCESTOR CHECK ----------

// A is child of B ?
let levelAB = getAncestorLevel(A.personId, B.personId);

if(levelAB > 0){

  if(levelAB === 1)
    return `${A.name} is child of ${B.name}`;

  if(levelAB === 2)
    return `${A.name} is grandchild of ${B.name}`;

  return `${A.name} is ${
    "great ".repeat(levelAB-2)
  }grandchild of ${B.name}`;
}


// B is child of A ?
let levelBA = getAncestorLevel(B.personId, A.personId);

if(levelBA > 0){

  if(levelBA === 1)
    return `${A.name} is parent of ${B.name}`;

  if(levelBA === 2)
    return `${A.name} is grandparent of ${B.name}`;

  return `${A.name} is ${
    "great ".repeat(levelBA-2)
  }grandparent of ${B.name}`;
}

  return "Relation not mapped yet";
}

document.getElementById("searchA")
.addEventListener("input", function(){
  filterList(this.value, "personA");
});

document.getElementById("searchB")
.addEventListener("input", function(){
  filterList(this.value, "personB");
});

function filterList(text, selectId){

  const sel = document.getElementById(selectId);
  sel.innerHTML = "";

  const q = text.toLowerCase();

  people
    .filter(p => p.name.toLowerCase().includes(q))
    .forEach(p=>{
      sel.add(new Option(
        p.name + " ("+p.personId+")",
        p.personId
      ));
    });
}

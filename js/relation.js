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
  const A = document.getElementById("personA");
  const B = document.getElementById("personB");

  people.forEach(p=>{
    const opt1 = new Option(p.name + " ("+p.personId+")", p.personId);
    const opt2 = new Option(p.name + " ("+p.personId+")", p.personId);
    A.add(opt1);
    B.add(opt2);
  });
}

function checkRelation(){
  const a = document.getElementById("personA").value;
  const b = document.getElementById("personB").value;

  const res = findRelation(a, b);
  document.getElementById("result").innerText = res;
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

  return "Relation not mapped yet";
}

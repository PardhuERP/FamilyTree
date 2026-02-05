<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MyFamilyTree</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="css/style.css">
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>

<div class="toolbar toolbarCol">

  <!-- 3 DOT MENU -->
  <div class="menuWrap">
    <button id="menuBtn" class="circleBtn">⋮</button>

    <div id="menuBox" class="menuBox">
      <div onclick="openEdit()">✏ Edit Member</div>
      <div onclick="openDelete()">🗑 Delete Member</div>
      <hr>
      <a href="relation.html">🔗 Relation Finder</a>
      <a href="coming-soon.html">🕒 More</a>
      <a href="#">⚙️ Settings</a>
      <div onclick="logout()">🚪 Logout</div>
    </div>
  </div>

  <!-- ROW 1 -->
  <div class="row rowTop">
    <span id="familyTitle" class="appTitle">🌳 MyFamilyTree</span>
  </div>

  <!-- ROW 2 -->
  <div class="row rowSearch">
    <input id="searchBox" class="searchInput" placeholder="Search name...">
  </div>

  <!-- ROW 3 -->
  <div class="row rowActions">
    <button id="addPageBtn" class="addBtnUI">
      <span class="icon">➕</span>
      <span class="text">Add Name</span>
    </button>

    <button id="collapseBtn" class="circleBtn">−</button>
    <button id="expandBtn" class="circleBtn">+</button>
  </div>

</div>

<svg id="tree"></svg>

  <script>
const API_URL =
"https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";

const urlParams = new URLSearchParams(window.location.search);
const shareToken = urlParams.get("share");

if(shareToken){

  // ✅ SHARE MODE (NO LOGIN REQUIRED)
  fetch(API_URL + "?action=getFamilyByShare&shareToken=" + shareToken)
    .then(r => r.json())
    .then(res => {

      if(res.status === "OK"){

        localStorage.setItem("familyId", res.familyId);

        document.getElementById("familyTitle").innerText =
          "🌳 " + res.familyName;

        // hide edit buttons
        document.getElementById("addPageBtn").style.display = "none";
        document.getElementById("collapseBtn").style.display = "none";
        document.getElementById("expandBtn").style.display = "none";

      } else {
        alert("Invalid share link");
        location.href = "login.html";
      }
    });

}else{

  // ✅ NORMAL APP FLOW
  if(!localStorage.getItem("userId")){
    location.href = "login.html";
  }

  if(!localStorage.getItem("familyId")){
    location.href = "family-select.html";
  }
}
</script>

<script src="js/tree.js"></script>


<script>
  document.getElementById("addPageBtn").onclick = function () {
    window.location.href = "add.html";
  };

  // MENU
  var btn = document.getElementById("menuBtn");
  var box = document.getElementById("menuBox");

  btn.onclick = function (e) {
    e.stopPropagation();
    box.classList.toggle("show");
  };

  document.onclick = function (e) {
    if (!box.contains(e.target)) {
      box.classList.remove("show");
    }
  };

  function openEdit(){
  if(!window.selectedNode || !window.selectedNode.personId){
    alert("Tap a member first");
    return;
  }

  const newName = prompt("Edit name:", window.selectedNode.name);
  if(!newName) return;

  fetch(API_URL +
    "?action=updatePerson" +
    "&personId=" + window.selectedNode.personId +
    "&name=" + encodeURIComponent(newName)
  )
  .then(r=>r.json())
  .then(res=>{
    if(res.status==="OK"){
      alert("Updated");
      location.reload();
    }
  });
  }
  function openDelete(){
  if(!window.selectedNode){
    alert("Tap a member first");
    return;
  }

  if(!confirm("Delete " + window.selectedNode.name + "?")) return;

  fetch(API_URL + "?action=deletePerson&personId=" + window.selectedNode.personId)
    .then(r=>r.json())
    .then(res=>{
      if(res.status==="OK"){
        alert("Deleted");
        location.reload();
      }
    });
}
  
  function logout(){
  localStorage.clear();
  location.href = "login.html";
  }
</script>
</body>
 
</html>

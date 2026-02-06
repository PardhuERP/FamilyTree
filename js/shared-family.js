const API_URL =
"https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";

const userId = localStorage.getItem("userId");

if(!userId){
  location.href = "login.html";
}

/* ---------- SEARCH FAMILY ---------- */
function searchFamily(){

  const name =
    document.getElementById("searchFamily").value.trim();

  if(!name){
    alert("Enter family name");
    return;
  }

  fetch(API_URL +
    "?action=searchFamilies&name=" +
    encodeURIComponent(name)
  )
  .then(r=>r.json())
  .then(res=>{
    if(res.status==="OK"){
      showResults(res.families);
    }
  });
}

/* ---------- SHOW RESULT ---------- */
function showResults(list){

  const box = document.getElementById("searchResults");
  box.innerHTML = "";

  if(!list.length){
    box.innerHTML = "<p>No family found</p>";
    return;
  }

  list.forEach(f=>{
    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <div style="padding:12px;
                  border-radius:12px;
                  background:#f3f4f6">
        <b>🌳 ${f.name}</b><br>
        <button onclick="requestAccess('${f.familyId}')">
          Request Access
        </button>
      </div>
    `;

    box.appendChild(div);
  });
}

/* ---------- REQUEST ACCESS ---------- */
function requestAccess(fid){

  fetch(API_URL +
    "?action=requestFamilyAccess" +
    "&familyId=" + fid +
    "&userId=" + userId
  )
  .then(r=>r.json())
  .then(res=>{
    alert(res.message);
  });
}

const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = "F001";

const width = window.innerWidth;
const height = window.innerHeight - 120;

/* ---------- TREE SETUP ---------- */
let svg, g, treeLayout, root, i = 0;
let map = {};
const searchBox = document.getElementById("searchBox");

if(document.getElementById("tree")){
  svg = d3.select("#tree")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.3,3]).on("zoom", e=>{
      g.attr("transform", e.transform);
    }));

  g = svg.append("g")
    .attr("transform", `translate(${width/2}, 80)`);

  treeLayout = d3.tree().nodeSize([80,180]);

  fetch(`${API_URL}?action=getTree&familyId=${FAMILY_ID}`)
    .then(r => r.json())
    .then(res => {
      if(res.status === "OK"){
        buildTree(res.data);
      }
    });
}

/* ---------- BUILD TREE ---------- */
function buildTree(rows){
  if(!rows || rows.length === 0){
    alert("No members found. Add founder.");
    return;
  }

  map = {};
  rows.forEach(p => map[p.personId] = {...p, children:[]});
  rows.forEach(p => {
    if(p.fatherId && map[p.fatherId]){
      map[p.fatherId].children.push(map[p.personId]);
    }
  });

  const founder = rows.find(r => !r.fatherId);
  root = d3.hierarchy(map[founder.personId]);

  root.x0 = height/2;
  root.y0 = 0;

  root.children && root.children.forEach(collapse);
  update(root);
  centerNode(root);
}

function collapse(d){
  if(d.children){
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source){
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();
  nodes.forEach(d => d.y = d.depth * 180);

  const node = g.selectAll(".node")
    .data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append("g")
    .attr("class","node")
    .attr("transform", `translate(${source.y0},${source.x0})`)
    .style("cursor","pointer")
    .on("click", toggle);

  nodeEnter.append("rect")
    .attr("width",100).attr("height",30)
    .attr("x",-50).attr("y",-15);

  nodeEnter.append("text")
    .attr("dy",".35em")
    .attr("text-anchor","middle")
    .text(d => d.data.name);

  nodeEnter.merge(node).transition().duration(400)
    .attr("transform", d => `translate(${d.y},${d.x})`);

  const link = g.selectAll(".link")
    .data(links, d => d.target.id);

  link.enter().insert("path","g")
    .attr("class","link")
    .merge(link)
    .transition().duration(400)
    .attr("d", d => diagonal(d.source,d.target));

  nodes.forEach(d => { d.x0=d.x; d.y0=d.y; });
}

function diagonal(s,d){
  return `M ${s.y} ${s.x}
          C ${(s.y+d.y)/2} ${s.x},
            ${(s.y+d.y)/2} ${d.x},
            ${d.y} ${d.x}`;
}

/* ---------- NODE CLICK ---------- */
function toggle(event,d){
  localStorage.setItem("selectedParent", d.data.personId);
  localStorage.setItem("selectedParentName", d.data.name);

  if(d.children){
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

/* ---------- BUTTONS ---------- */
if(document.getElementById("collapseBtn")){
  document.getElementById("collapseBtn").onclick = () => {
    if(!root) return;
    root.children && root.children.forEach(collapse);
    update(root);
  };
}

if(document.getElementById("expandBtn")){
  document.getElementById("expandBtn").onclick = () => {
    if(!root) return;
    root.each(d=>{
      if(d._children){
        d.children = d._children;
        d._children = null;
      }
    });
    update(root);
  };
}

/* ---------- ADD PERSON ---------- */
function addPerson(){
  const name = document.getElementById("pname")?.value;
  const gender = document.getElementById("pgender")?.value;
  const dob = document.getElementById("pdob")?.value;
  const place = document.getElementById("pplace")?.value;
  const fatherId = document.getElementById("pfather")?.value;

  if(!name){
    alert("Enter name");
    return;
  }

  fetch(
    API_URL +
      "?action=addPerson" +
      "&familyId=" + FAMILY_ID +
      "&name=" + encodeURIComponent(name) +
      "&gender=" + gender +
      "&dob=" + dob +
      "&place=" + encodeURIComponent(place) +
      "&fatherId=" + fatherId +
      "&generation=2"
  )
  .then(r => r.json())
  .then(res => {
    if(res.status === "OK"){
      alert("Added successfully!");
      localStorage.clear();
      window.location.href = "index.html";
    } else {
      alert("Error adding person");
    }
  });
}

/* ---------- SEARCH ---------- */
if(searchBox){
  searchBox.addEventListener("input", function(){
    const q = this.value.toLowerCase();
    if(!root) return;

    g.selectAll(".node")
      .classed("search-match", false); // reset

    if(!q) return;

    g.selectAll(".node").each(function(d){
      if(d.data.name.toLowerCase().includes(q)){
        d3.select(this).classed("search-match", true);
        centerNode(d); // focus first match
      }
    });
  });
}

function centerNode(d){
  if(!svg || !g) return;

  const scale = 1;
  const x = width / 2 - d.y * scale;
  const y = 120 - d.x * scale;

  svg.transition().duration(400)
    .call(
      d3.zoom().transform,
      d3.zoomIdentity.translate(x, y).scale(scale)
    );
}

/* ---------- ADD BUTTON ---------- */
if(document.getElementById("addBtn")){
  document.getElementById("addBtn").addEventListener("click", addPerson);
}

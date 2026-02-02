const data = {
  name: "Founder",
  children: [
    { name: "Son 1", children:[{name:"Child 1"},{name:"Child 2"}]},
    { name: "Daughter", children:[{name:"Child 3"}]}
  ]
};

const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("svg")
  .call(d3.zoom().scaleExtent([0.3,3]).on("zoom", e=>{
    g.attr("transform", e.transform);
  }));

const g = svg.append("g").attr("transform","translate(50,50)");
const treeLayout = d3.tree().nodeSize([80,180]);
let root = d3.hierarchy(data);
root.x0 = height/2; root.y0 = 0;

function collapse(d){
  if(d.children){
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}
root.children.forEach(collapse);
update(root);

function update(source){
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();
  nodes.forEach(d=>d.y = d.depth*180);

  const node = g.selectAll(".node").data(nodes,d=>d.id||(d.id=++i));
  const nodeEnter = node.enter().append("g")
    .attr("class","node")
    .attr("transform",d=>`translate(${source.y0},${source.x0})`)
    .on("click",toggle);

  nodeEnter.append("rect")
    .attr("width",100).attr("height",30)
    .attr("x",-50).attr("y",-15);

  nodeEnter.append("text")
    .attr("dy",".35em").attr("text-anchor","middle")
    .text(d=>d.data.name);

  nodeEnter.merge(node).transition().duration(400)
    .attr("transform",d=>`translate(${d.y},${d.x})`);

  g.selectAll(".link").data(links,d=>d.target.id)
    .enter().insert("path","g").attr("class","link")
    .merge(g.selectAll(".link"))
    .transition().duration(400)
    .attr("d",d=>diagonal(d.source,d.target));

  nodes.forEach(d=>{d.x0=d.x; d.y0=d.y;});
}

function diagonal(s,d){
  return `M ${s.y} ${s.x}
          C ${(s.y+d.y)/2} ${s.x},
            ${(s.y+d.y)/2} ${d.x},
            ${d.y} ${d.x}`;
}

function toggle(e,d){
  if(d.children){d._children=d.children; d.children=null;}
  else{d.children=d._children; d._children=null;}
  update(d);
}
function collapseAll(){root.children.forEach(collapse); update(root);}
function expandAll(){root.each(d=>{if(d._children){d.children=d._children; d._children=null;}}); update(root);}
let i=0;

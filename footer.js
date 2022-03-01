
let above = false;

const cutoffFoot = 200;

var textFoot = new Blotter.Text("So we beat on, boats against the current, borne back ceaselessly into the past.", {
  family : "serif",
  size : 20,
  fill : "white",
  paddingLeft : 50,
  paddingTop : 800,
});

var materialFoot = new Blotter.FliesMaterial();

materialFoot.uniforms.uPointCellWidth.value = 0.001;
materialFoot.uniforms.uPointRadius.value = .8;
materialFoot.uniforms.uSpeed.value = 5;

var blotterFoot = new Blotter(materialFoot, { 
  texts : textFoot,
});

blotterFoot.needsUpdate = true;

var elemFoot = document.getElementById('footer-text');
var scopeFoot = blotterFoot.forText(textFoot);

scopeFoot.appendTo(elemFoot);


// window.addEventListener("scroll", (event) => {
//     let scroll = this.scrollY;
//     if(this.scrollY > cutoff)
//     	elem.style.opacity = 0;
//     else
// 	    elem.style.opacity = 1-this.scrollY/cutoff;
// });
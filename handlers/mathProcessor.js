const mjAPI = require("mathjax-node");
const { createCanvas, loadImage } = require('canvas');

mjAPI.config({
  MathJax: {
    // Traditional MathJax configuration
  }
});
mjAPI.start();

async function renderMath(expression) {
  return new Promise((resolve, reject) => {
    mjAPI.typeset({
      math: expression,
      format: "TeX", // or "inline-TeX", "MathML"
      svg: true,
    }, function (data) {
      if (data.errors) {
        reject(data.errors);
      } else {
        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext('2d');
        loadImage(`data:image/svg+xml;base64,${Buffer.from(data.svg).toString('base64')}`)
          .then(image => {
            ctx.drawImage(image, 0, 0);
            resolve(canvas.toBuffer());
          })
          .catch(err => reject(err));
      }
    });
  });
}

module.exports = { renderMath };

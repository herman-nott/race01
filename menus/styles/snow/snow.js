const canvas = document.getElementById('snow');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const snowflakes = [];
const snowflakeCount = 200;

class Snowflake {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * -height;
    this.radius = Math.random() * 4 + 1;
    this.speedY = Math.random() * 2 + 0.5;
    this.speedX = Math.random() * 1 - 0.5;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;

    if (this.y > height) this.reset();
    if (this.x > width || this.x < 0) this.reset();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

for (let i = 0; i < snowflakeCount; i++) {
  snowflakes.push(new Snowflake());
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  snowflakes.forEach(snowflake => {
    snowflake.update();
    snowflake.draw();
  });
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

animate();
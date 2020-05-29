// 粒子创建器
export class ParticleCreater {
  constructor(
    ctx,
    {
      count = 1,
      minRadius = 2,
      maxRadius = 5,
      minV = 0.1,
      maxV = 1
    } = {}
  ) {
    this.ctx = ctx;
    this.count = count;
    this.minRadius = minRadius;
    this.maxRadius = maxRadius;
    this.minV = minV;
    this.maxV = maxV;
    this.particles = [];

    this.createParticles();
  }

  // 创建粒子
  createParticles() {
    for (let i = 0; i < this.count; i++) {
      const radius = Methods.randomValue(this.minRadius, this.maxRadius);
      const speed = Methods.randomPlusMinus(0.11, 0.17);
      this.particles.push(
        /*
        // 圆形粒子
        new CircleParticle(
          this.ctx,
          {
            ...Methods.randomPosition(radius, this.ctx.canvas.width - radius, radius, this.ctx.canvas.height - radius),
            ...Methods.randomSpeed(),
            radius,
            minRadius: 0.5,
            maxRadius: this.maxRadius,
            growSpeed: speed
          },
          {
            fillStyle: Methods.randomColor()
          }
        ),
        // 矩形粒子
        new RectangleParticle(
          this.ctx,
          {
            shape: 'rectangle',
            ...Methods.randomPosition(radius, this.ctx.canvas.width - radius, radius, this.ctx.canvas.height - radius),
            width: radius * 2,
            minWidth: 1,
            maxWidth: this.maxRadius * 2,
            height: radius * 2,
            minHeight: 1,
            maxHeight: this.maxRadius * 2,
            growSpeedWidth: speed,
            growSpeedHeight: speed
          },
          {
            fillStyle: Methods.randomColor()
          }
        ),
        */
        // 多边形粒子
        new CircumcenterPolygonParticle(
          this.ctx,
          {
            x: this.ctx.canvas.width / 2,
            y: this.ctx.canvas.height / 2,
            radius: 100,
            growSpeed: 0,
            rotateSpeed: 1
          },
          {
            fillStyle: Methods.randomColor()
          }
        )
      );
    }
  }

  // 清除粒子
  clearParticles() {
    this.particles = [];
  }
}
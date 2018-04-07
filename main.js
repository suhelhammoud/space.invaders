const abs = Math.abs;

const canvas = document.getElementById("canvas");
const shootSound = document.getElementById("shoot-sound");

class UFO {
    constructor(size, center) {
        this.size = size;
        this.center = center; // {x: , y: } coordinates
    }

    draw(ctx) {
        ctx.fillRect(
            this.center.x - this.size / 2,
            this.center.y - this.size / 2,
            this.size,
            this.size
        )
    }

    update() {
        // this.center.x += 1;
        // this.center.y -= 1;
    }

    isOverlappingV(that) {
        return abs(this.center.x - that.center.x) < (this.size + that.size) / 2;
    }

    isOverlappingH(that) {
        return abs(this.center.y - that.center.y) < (this.size + that.size) / 2;
    }

    isCollidingWith(that) {
        return this !== that &&
            this.isOverlappingV(that) &&
            this.isOverlappingH(that);
    }

    isCollidingWithSomeOf(those) {
        return those.some(one => one.isCollidingWith(this));
    }

    isNotCollidingWithAnyOf(those) {
        return those.every(one => !one.isCollidingWith(this))
    }

}



class Game {
    constructor(canvas, shootSound) {
        this.ctx = canvas.getContext("2d");
        this.shootSound = shootSound;
        this.size = canvas.width;
        this.center = { x: this.size / 2, y: this.size / 2 };
        this.ufos = [
            new Player(this),
            ... this.createInvaders()
        ]
    }

    createInvaders() {
        const invaders = [];
        for (let i = 0; i < 24; i++) {
            let x = 20 + i % 8 * 30;
            let y = 20 + i % 3 * 30;
            invaders.push(new Invader(this, { x, y }))
        }
        return invaders;
    }

    anyINvadersBelow(invader) {
        return this.ufos
            .filter(s => s instanceof Invader)
            .some(i => i.center.y > invader.center.y && invader.isOverlappingV(i))
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.size, this.size);
    }

    draw(ctx) {
        this.ufos.forEach(u => u.draw(this.ctx));
    }

    checkLosing(ufoType) {
        const anyRemainingOnes = this.ufos
            .some(ufo => ufo instanceof ufoType);

        if (!anyRemainingOnes) {
            this.gameIsEnded = true;
            this.ctx.font = "30px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(`${ufoType.name} loses !`, this.center.x, this.center.y);
        }
    }

    update() {
        // check who lose
        this.checkLosing(Player);
        this.checkLosing(Invader);
        this.ufos.forEach(u => u.update());

        // take out collided ufos
        this.ufos = this.ufos
            .filter(s => s.isNotCollidingWithAnyOf(this.ufos));
    }

    start() {
        if (this.gameIsEnded) return;
        this.clearCanvas();
        this.update();
        this.draw(this.ctx);
        requestAnimationFrame(this.start.bind(this))
    }
}


class Player extends UFO {
    constructor(game) {
        super(15, { x: game.center.x, y: game.size - 7 });
        this.game = game;
        this.keyboard = new Keyboard();
    }

    update() {
        const k = this.keyboard;
        if (k.isDown(Keyboard.LEFT)) {
            this.center.x -= 2;
        }

        if (k.isDown(Keyboard.RIGHT)) {
            this.center.x += 2;
        }

        
        if (k.isDown(Keyboard.SPACE)) {
            if (Math.random() > .08) return;

            // add Bullet from this position
            let { x, y } = this.center;
            y -= Bullet.SIZE + this.size / 2;
            //shoot !
            this.game.ufos.push(new Bullet({ x, y }, -2));
            this.game.shootSound.play();
        }
    }
}

class Invader extends UFO {
    constructor(game, center) {
        super(15, center);
        this.game = game;
        this.hSpeed = .3;
        this.xRelative = 0;
    }

    update() {
        if (this.xRelative < 0 || this.xRelative > 50) {
            this.hSpeed = - this.hSpeed;
        }
        this.center.x += this.hSpeed;
        this.xRelative += this.hSpeed;

        if (Math.random() > 0.005) return;
        if (this.game.anyINvadersBelow(this)) return;

        game.ufos.push(new Bullet(
            { x: this.center.x, y: this.center.y + Bullet.SIZE + this.size / 2 },
            2
        ))
    }
}

class Bullet extends UFO {
    static get SIZE() {
        return 3;
    }

    constructor(center, vSpeed) {
        super(3, center);
        this.vSpeed = vSpeed;
    }

    update() {
        this.center.y += this.vSpeed;
    }
}


class Keyboard {

    static get LEFT() { return 37 };
    static get RIGHT() { return 39 };
    static get SPACE() { return 32 };

    constructor() {
        const keys = new Map(); // keyCode: true/false
        window.addEventListener("keydown", e => keys.set(e.keyCode, true));
        window.addEventListener("keyup", e => keys.set(e.keyCode, false));
        this.keys = keys;
    }

    isDown(keyCode) {
        return this.keys.get(keyCode) === true;
    }
}

const game = new Game(canvas, shootSound);
game.start();



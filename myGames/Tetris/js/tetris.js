window.onload = function() {
    new Tetris();
};

function Tetris() {
        this.boxSize = []; // 游戏 box 的大小
        this.dropCoords = []; // 记录正在下落的方块的坐标
        this.dropNowType = []; // 记录当前出现的方块类型 0~6
        this.dropNextType = []; // 记录之后连续两个会出现的方块类型 0~6
        this.timer = null; // 游戏定时器
        this.existCoords = []; // 保存存在未消除格子的 div 坐标
        this.speed = null; // 游戏速度

        return this.gameInit();
    }

(function() {
    // 游戏初始化
    Tetris.prototype.gameInit = function() {
        // 参数初始化
        this.boxSize = [15, 20];
        this.dropCoords = [];
        this.dropNowType = [];
        this.dropNextType = [];
        this.timer = null;
        this.existCoords = [];
        this.speed = 200;

        this.createBoxDiv(); // 背景初始化
        this.createSidebar(); // 侧边栏初始化

        this.gameStart();
    }

    // 创建游戏背景框架
    Tetris.prototype.createBoxDiv =  function() {
        let [x, y] = this.boxSize;
        // 创建一个总的游戏框
        let box = $('<div class="game-box"></div>');

        // 创建背景 “ 像素 ” 点
        for(let i = 0; i < y; i++) {
            for(let j = 0; j < x; j++) {
                let boxDiv = $('<div class="game-box-div"></div>');
                boxDiv.attr('index', [j, i]);
                box.append(boxDiv);
            }

            // 清除浮动，换行
            let boxClear = $('<div class="clear"></div>');
            box.append(boxClear);
        }
        
        $('#app').append(box);
    }

    // 创建侧边栏：展示分数、预览下一个方块等信息
    Tetris.prototype.createSidebar = function() {
        let sidebar = $('<div class="sidebar"></div>');

        $('#app').append(sidebar);
    }

    // 游戏开始
    Tetris.prototype.gameStart = function() {

        document.onclick = function() {
            this.setControls();
            this.dropping();

            document.onclick = null;
        }.bind(this);

    }

    // 方块下落
    Tetris.prototype.dropping = function() {
        this.createOneDrop(); // 创建一个下落的方块
        this.createBlock(); 

        // 定时下落
        this.timer = setInterval(() => {
            this.createBlock(false); // 清除当前位置的图形
            if(!this.isDropStop()) { 
                // 判断方块是否已经落到底部
                for(let val of this.dropCoords) {
                    val[1]++; // 纵坐标 +1                 
                }
            }
            else {
                // 判断是否下落到底部或其它未消除的格子
                if(this.timer) {
                    this.createBlock(); // 绘制当前位置的图形
                    clearInterval(this.timer); // 停止计时器
                    this.timer = null; // 清空计时器
                    this.gameOver(); // 判断游戏是否结束
                    this.dropCoords.forEach(val => this.existCoords.push(val)); // 保存未消除的格子
                    this.clearBlock(); // 消除一行或多行格子

                    this.dropNowType.shift(); // 清除当前的下落方块

                    return this.dropping();
                } 
            }
            
            this.createBlock(); // 绘制当前位置的图形

        }, this.speed);
    }

    // 创建一个新的下落方块
    Tetris.prototype.createOneDrop = function() {
        // if(this.dropNowType.length != 0) {
        //     this.dropNowType.shift();
        // }

        this.createRandomType(); // 创建随机队列

        // 判断是否为空
        if(this.dropNowType.length == 0) {
            return;
        }

        // 判断并选择生成对应的方块类型
        switch(this.dropNowType[0]) {
            case 0: this.dropCoords = [[0, 0], [0, 1], [0, 2], [0, 3]];break;
            case 1: this.dropCoords = [[0, 0], [1, 0], [0, 1], [0, 2]];break;
            case 2: this.dropCoords = [[0, 0], [1, 0], [1, 1], [1, 2]];break;
            case 3: this.dropCoords = [[0, 0], [1, 0], [1, 1], [2, 1]];break;
            case 4: this.dropCoords = [[1, 0], [2, 0], [0, 1], [1, 1]];break;
            case 5: this.dropCoords = [[0, 0], [1, 0], [2, 0], [1, 1]];break;
            case 6: this.dropCoords = [[0, 0], [1, 0], [0, 1], [1, 1]];break;
            default: break;
        }

        // dropCoords 坐标上移
        let maxCol = Math.max.apply(Math, [...this.dropCoords].map(val => val[1])) + 1; // 获取一组格子列坐标的最大值
        this.dropCoords.forEach(val => {
            val[1] -= maxCol;
        });

        // 初始生成的下落方块居中
        for(let val of this.dropCoords) {
            val[0] += Math.floor(this.boxSize[0] / 2) - 1;
        }

        this.createRandomType(); // 补充后一个即将落下的方块类型
    }

    // 判断并消除一行或多行格子
    Tetris.prototype.clearBlock = function() {
        ;
    }

    // 判断是否游戏结束，并执行
    Tetris.prototype.gameOver = function() {
        ;
    }

    // 判断是否碰撞到其它未消除的格子
    Tetris.prototype.isOverlay = function(xy) {
        let [xp, yp] = [xy[0], xy[1] + 1]; // 纵坐标 +1 时，判断是否有格子与之重叠
        for(let val of this.existCoords.values()) {
            if([xp, yp].toString() == val.toString()) {
                // 若存在重叠则返回 true
                return true;
            }
        }
        return false;
    }

    // 判断正在下落的方块的下一格格子是否是底部或者已经存在格子
    Tetris.prototype.isDropStop = function() {
        return this.dropCoords.some(val => {
            // 判断是否碰到其它方块或触底
            return this.isOverlay(val) || (val[1] + 1 >= this.boxSize[1]);
        });
    }

    // 随机生成下落方块的类型
    Tetris.prototype.createRandomType = function() {
        // 判断当前是否非空，初始化设置
        if(this.dropNowType.length == 0) {
            if(this.dropNextType.length == 0) {
                this.dropNowType.push(Math.floor(Math.random() * 7)); // 随机类型
            }
            else {
                this.dropNowType.push(this.dropNextType.shift());
            }
        }

        // 判断数组是否为空
        while(this.dropNextType.length < 2) {
            let num = Math.floor(Math.random() * 7); // 随机生成 0~6 的数字
            this.dropNextType.push(num);
        }
    }

    // 绘制方块
    Tetris.prototype.createBlock = function(act=true) {
        // 绘制
        if(act) {
            for(let i = 0; i < this.dropCoords.length; i++) {
                if(this.dropCoords[i][1] >= 0) {
                    this.getIndex(this.dropCoords[i]).html('<div class="block"><div>');
                }
            }
        }
        // 清除
        else {
            for(let i = 0; i < this.dropCoords.length; i++) {
                if(this.dropCoords[i][1] >= 0) {
                    this.getIndex(this.dropCoords[i]).html('');
                }
            }
        }
    }

    // 根据坐标获得相对应的  game-box-div 元素的下标
    Tetris.prototype.getIndex = function(xy) {
        // 传入的参数转为数字类型，防止传入字符串出错
        xy[0] = parseInt(xy[0]);
        xy[1] = parseInt(xy[1]);
        return $('.game-box-div').eq(xy[0] + xy[1] * this.boxSize[0]);
    }  

    // 设置游戏的控制方式，判断位移的合法性
    Tetris.prototype.setControls = function() { 
        $(document).on('keydown', ev => {
            ev = ev || window.event;
            let temp = [];
            // 判断位移后坐标值是否合法
            if(this.dropCoords.every(val => {
                let [x, y] = val; // 记录当前各个方块的坐标值
                switch(ev.keyCode) {
                    case 37: x--; break;
                    case 39: x++; break;
                    case 40: break;
                    default: break;
                }
                temp.push([x , y]); // 暂存可能位移后的坐标值
                return (x >= 0 && x < this.boxSize[0]) && !this.hasBlock([x, y]);
            })){
                // 若合法则进行位移
                this.createBlock(false);
                this.dropCoords = temp;
                this.createBlock();
            }
        })
    }

    // 判断当前坐标是否存在 block
    Tetris.prototype.hasBlock = function(xy) {
        return this.existCoords.some(val => {
            return val.toString() == xy.toString();
        });
    }
})();


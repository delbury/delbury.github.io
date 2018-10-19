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
        this.createOneDrop(); // 创建一个下落的方块
        this.createBlock(); 
        console.log(this.dropNowType)

        document.onclick = function() {
            // 定时下落
            this.timer = setInterval(() => {
                this.createBlock(false);
                for(let val of this.dropCoords) {
                    val[1]++;
                    if(val[1] >= this.boxSize[1] - 1 || this.isOverlay(val)) {
                        // 判断是否下落到底部或其它未消除的格子
                        if(this.timer) {
                            clearInterval(this.timer); // 停止计时器
                            this.timer = null; // 清空计时器
                            this.gameOver(); // 判断游戏是否结束
                            this.dropCoords.forEach(val => this.existCoords.push(val)); // 保存未消除的格子
                            this.clearBlock(); // 消除一行或多行格子
                        }             
                    }
                }
                this.createBlock();
            }, 500);
        }.bind(this) 
    }

    // 创建一个新的下落方块
    Tetris.prototype.createOneDrop = function() {
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
        ;
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
                this.getIndex(this.dropCoords[i]).html('<div class="block"><div>');
            }
        }
        // 清除
        else {
            for(let i = 0; i < this.dropCoords.length; i++) {
                this.getIndex(this.dropCoords[i]).html('');
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
})();


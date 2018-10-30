window.onload = function() {
    new Tetris();
};

function Tetris() {
        this.boxSize = [15, 20]; // 游戏 box 的大小
        this.dropCoords = []; // 记录正在下落的方块的坐标
        this.dropNowType = []; // 记录当前出现的方块类型 0~6
        this.dropNowTypeRotate = []; // 记录当前方块旋转次数
        this.dropOriginPoint = []; // 当前的旋转中心
        this.oxy = [[.5, 1.5], [0, 1], [1, 1], [1, 1], [1, 1], [1, 0], [.5, .5]]; // 不同 block 的旋转中心
        this.dropNextType = []; // 记录之后连续两个会出现的方块类型 0~6
        this.dropNextTypeRotate = []; // 记录之后连续两个会出现的方块旋转次数
        this.timer = null; // 游戏定时器
        this.existCoords = []; // 保存存在未消除格子的 div 坐标
        this.speed = null; // 游戏速度
        this.isquickdropping = false; // 快速下落标志
        this.scores = null; // 记录分数
        this.levels = null; // 记录等级，影响方块下落速度
        this.previewBoxSize = [6, 6]; // 预览区的盒子大小
        this.previewOriginalCoords = [
            [[2, 1], [2, 2], [2, 3], [2, 4]],
            [[2, 1], [3, 1], [2, 2], [2, 3]],
            [[2, 1], [3, 1], [3, 2], [3, 3]],
            [[2, 2], [3, 2], [3, 3], [4, 3]],
            [[3, 2], [4, 2], [2, 3], [3, 3]],
            [[2, 2], [3, 2], [4, 2], [3, 3]],
            [[2, 2], [3, 2], [2, 3], [3, 3]],
        ]; // 预览区中的各个方块的初始坐标，按 type 0 ~ 6 排列
        this.previewOriginalxy = [2.5, 2.5]; // 预览区中的各个方块的旋转中心

        return this.gameInit();
    }

(function() {
    // 游戏初始化
    Tetris.prototype.gameInit = function() {
        $('#app').html(''); // 清空原游戏界面
        $(document).off('keydown');
        // 参数初始化
        this.dropCoords = [];
        this.dropNowType = [];
        this.dropNowTypeRotate = [];
        this.dropOriginPoint = [];
        this.dropNextType = [];
        this.dropNextTypeRotate = [];
        this.timer = null;
        this.existCoords = [];
        this.speed = 500;
        this.isquickdropping = false;
        this.scores = 0;
        this.levels = 1;

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
        let scores = $(`<div class="scores"></div>`); // 展示分数等信息
        let preview = $('<div class="preview"></div>'); // 展示预览方块

        scores.html(`
        <p>Scores: <span>0</span></p>
        <p>Level: <span>1</span></p>
        `);
        // 创建预览界面
        for(let i = 0; i < this.previewBoxSize[0]; i++) {
            for(let j = 0; j < this.previewBoxSize[1]; j++) {
                let div = $('<div class="game-box-div"></div>');
                preview.append(div);
            }
            preview.append($('<div class="clear"></div>'));
        }

        sidebar.append(scores)
        sidebar.append(preview);
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
                this.dropCoords.forEach(val => {
                    val[1]++; // 纵坐标 +1    
                })

                this.dropOriginPoint[1]++; // 旋转中心下移

            }
            else {
                // 判断是否下落到底部或其它未消除的格子
                if(this.timer) {
                    this.createBlock(); // 绘制当前位置的图形
                    clearInterval(this.timer); // 停止计时器
                    this.timer = null; // 清空计时器

                    if(this.isGameOver()) {
                        // 判断游戏是否结束
                        this.gameOver();
                        return;
                    }
                    this.dropCoords.forEach(val => this.existCoords.push(val)); // 保存未消除的格子
                    this.scores += 4; // 基本分 +4
                    this.clearBlock(this.dropCoords); // 消除一行或多行格子
                    this.dropNowType.shift(); // 清除当前的下落方块
                    this.dropNowTypeRotate.shift(); // 清除当前方块的初始旋转次数

                    return this.dropping();
                } 
            }
            
            this.createBlock(); // 绘制当前位置的图形

        }, this.speed);
    }

    // 快速下落
    Tetris.prototype.quickDrop = function() {
        if(!this.isDropStop()) {
            this.isquickdropping = true;
            // 暂停原下落动作
            clearInterval(this.timer);
            this.timer = null;

            // 加速下落
            let temptimer = setInterval(() => {
                this.createBlock(false); // 清除原 block
                this.dropCoords.forEach(val => {
                    val[1]++;
                });
                this.dropOriginPoint[1]++; // 旋转中心坐标更新

                if(this.isDropStop()) {
                    this.createBlock(); // 绘制移动后的 block
                    clearInterval(temptimer);
                    temptimer = null;
                    // 保存数组
                    if(this.isGameOver()) {
                        // 判断游戏是否结束
                        this.gameOver();
                        return;
                    }
                    this.dropCoords.forEach(val => this.existCoords.push(val)); // 保存未消除的格子
                    this.scores += 4; // 基本分 +4
                    this.clearBlock(this.dropCoords); // 消除一行或多行格子
                    this.dropNowType.shift(); // 清除当前的下落方块
                    this.dropNowTypeRotate.shift(); // 清除当前方块的初始旋转次数

                    this.isquickdropping = false; // 初始化标志位
                    return this.dropping();
                }

                this.createBlock(); // 绘制移动后的 block
            }, 10);
        }
    }

    // 旋转正在下落的砖块
    Tetris.prototype.rotateBlocks = function() {
        this.createBlock(false); // 清空原图

        let [ox, oy] = this.dropOriginPoint;
        let arr = [];
        this.dropCoords.forEach((val) => {
            let [x,y] = val;
            arr.push([ox-oy+y,oy-x+ox]);
        })

        // 判断旋转的合法性
        if(arr.every(val => {
            return !this.hasBlock(val) && val[0] >= 0 && val[0] <this.boxSize[0];
        })) {
            this.dropCoords = arr;
        }

        this.createBlock(); // 重新绘制
    }

    // 创建一个新的下落方块
    Tetris.prototype.createOneDrop = function() {
        this.createRandomType(); // 创建随机队列

        // 判断是否为空
        if(this.dropNowType.length == 0) {
            return;
        }

        // 判断并选择生成对应的方块类型，前 4 个为对应方块的坐标，最后一位为旋转中心的坐标
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

        let [ox, oy] = this.oxy[this.dropNowType[0]]; // 对应类型方块的旋转中心

        // 随机旋转初始方块
        // let random = Math.floor(Math.random() * 4);
        for(let i = 0; i < this.dropNowTypeRotate; i++) {
            let arr = [];
            this.dropCoords.forEach((val) => {
                let [x,y] = val;
                arr.push([ox-oy+y,oy-x+ox]);
            })
            this.dropCoords = arr;
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

        // 设置旋转中心
        this.dropOriginPoint = [ox + Math.floor(this.boxSize[0] / 2) - 1, oy - maxCol];

        this.createRandomType(); // 补充后一个即将落下的方块类型
        this.createPreviewBlocks(); // 更新下一个方块的预览图
    }

    // 计算当前行下是否已经占满了格子
    Tetris.prototype.isFullRow = function(row) {
        let count = 0;
        this.existCoords.forEach(val => {
            if(val[1] == row) {
                count++;
            }
        });
        return count == this.boxSize[0];
    }

    // 判断并消除一行或多行格子
    Tetris.prototype.clearBlock = function(arr) {
        let rows = [];
        let minrows = [];
        // 获取最后停止状态下，格子所占的为第几行
        for(let i of arr) {
            // 筛选重复的值
            if(!rows.includes(i[1])) {
                rows.push(i[1]);
            }
        }

        if(rows.length != 0) {
            // 清空所有已经下落的方块
            this.existCoords.forEach(val => {
                this.getIndex(val).html('');
            });

            let clearrows = 0; // 记录清除的行数
            for(let i of rows) {
                // 消除满行的数据
                if(this.isFullRow(i)) {
                    minrows.push(i);
                    // 去除需要消除的格子
                    this.existCoords = this.existCoords.filter(val => {
                        return val[1] != i;
                    });

                    clearrows++; // 已清除的行数 +1
                }
            }

            // 根据一次消除的行数加分
            switch(clearrows) {
                case 1: this.scores += 1 * this.boxSize[0] + 2 ** 1; break;
                case 2: this.scores += 2 * this.boxSize[0] + 2 ** 2; break;
                case 3: this.scores += 3 * this.boxSize[0] + 2 ** 3; break;
                case 4: this.scores += 4 * this.boxSize[0] + 2 ** 4; break;
                default: break;
            }
            this.updateScores(); // 更新游戏分数

            // 上方的格子下移
            this.existCoords = this.existCoords.map(val => {
                if(val[1] < Math.min.apply(Math, minrows)) {
                    return [val[0], val[1] + clearrows];
                }
                else {
                    return val;
                }
            });

            // 重新绘制
            this.existCoords.forEach(val => {
                this.getIndex(val).html('<div class="block"><div>');
            });
        }
        
    }

    // 绘制下一个方块的预览图
    Tetris.prototype.createPreviewBlocks = function() {
        let divs = $('.sidebar .preview .game-box-div').html(''); // 清空预览图
        let [ox, oy] = this.previewOriginalxy;
        let nextBlock = [...this.previewOriginalCoords[this.dropNextType[0]]]; // 复制下一个方块的预览坐标

        // 旋转
        for(let i = 0; i < this.dropNextTypeRotate[0]; i++) {
            let arr = [];
            // 计算旋转后的坐标
            nextBlock.forEach((val) => {
                let [x,y] = val;
                arr.push([ox-oy+y,oy-x+ox]);
            })
            nextBlock = arr;
        }

        // 绘图
        nextBlock.forEach(val => {
            divs.eq(val[0] + val[1] * this.previewBoxSize[0]).html('<div class="block"><div>')
        });
    }

    // 更新游戏分数和下落速度等级
    Tetris.prototype.updateScores = function() {
        let msg = $('.scores p span');
        msg.eq(0).html(this.scores); // 更新分数显示

        if(this.scores >= 50 * this.levels && this.levels < 9) {
            this.levels++; // 级别增加
            this.speed -= 50; // 减少定时器间隔，加快下落速度
            msg.eq(1).html(this.levels); // 更新级别显示
        }
    }

    // 判断是否游戏结束，并执行
    Tetris.prototype.isGameOver = function() {
        return this.dropCoords.some(val => val[1] < 0);
    }

    // 游戏结束
    Tetris.prototype.gameOver = function() {
        console.log('game over');
        let boxHeight = $('.game-box').innerHeight(); // game box 的高度
        let boxWidth = $('.game-box').innerWidth(); // game box 的宽度
        let setHeight = boxHeight * .75; // 弹出框的高度
        let setWidth = boxWidth * .75; // 弹出框的宽度
        let over = $('<div class="game-over"></div>');

        // 将弹出框设置居中
        over.css({
            'height': setHeight + 'px',
            'width': setWidth + 'px',
            'top': (boxHeight - setHeight) / 2 + 'px',
            'left': (boxWidth - setWidth) / 2 + 'px',
        });

        // 创建弹出框的内容
        let re = $('<a href="javascript: void(0);">Restart the game</a>');
        let score = $(`<p>Your score is : ${this.scores}</p>`);
        // 重开游戏
        re.on('click', () => {
            this.gameInit();
        })

        over.html('<h1>Game Over</h1>').append(score, re);
        $('.game-box').append(over); 
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
                // 随机类型
                this.dropNowType.push(Math.floor(Math.random() * 7));
                this.dropNowTypeRotate.push(Math.floor(Math.random() * 4))
            }
            else {
                // 当前的方块类型被队列中的下一个替代
                this.dropNowType.push(this.dropNextType.shift());

                // 旋转次数相应更新
                this.dropNowTypeRotate.push(this.dropNextTypeRotate.shift());
            }
        }

        // 判断数组是否为空
        while(this.dropNextType.length < 2) {
            // 随机类型
            let random = Math.floor(Math.random() * 20);
            let type = null;
            if(random < 2) {
                type = 0;
            }
            else if(random < 6) {
                type = 1;
            }
            else if(random < 10) {
                type = 2;
            }
            else if(random < 12) {
                type = 3;
            }
            else if(random < 14) {
                type = 4;
            }
            else if(random < 18) {
                type = 5;
            }
            else {
                type = 6;
            }

            this.dropNextType.push(type);
            this.dropNextTypeRotate.push(Math.floor(Math.random() * 4)); // 随机旋转次数
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
            if(ev.keyCode >= 37 && ev.keyCode <=40) {
                ev.preventDefault(); // 阻止默认行为            

                let temp = [];
                // 判断位移后坐标值是否合法
                if(this.dropCoords.every(val => {
                    let [x, y] = val; // 记录当前各个方块的坐标值
                    switch(ev.keyCode) {
                        case 37: x--; break;
                        case 39: x++; break;
                        default: break;
                    }
                    temp.push([x , y]); // 暂存可能位移后的坐标值
                    return (x >= 0 && x < this.boxSize[0]) && !this.hasBlock([x, y]);
                })){
                    // 若合法则进行位移
                    this.createBlock(false);
                    this.dropCoords = temp;
                    this.createBlock();

                    // 旋转中心更新
                    switch(ev.keyCode) {
                        case 37: this.dropOriginPoint[0]--; break;
                        case 39: this.dropOriginPoint[0]++; break;
                        default: break;
                    }
                }

                // 快速下落
                if(ev.keyCode == 40) {
                    if(!this.isquickdropping) {
                        this.quickDrop();
                        return; // 完成后继续下一轮
                    }  
                }

                // 逆时针旋转
                if(ev.keyCode == 38) {
                    this.rotateBlocks();
                }
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


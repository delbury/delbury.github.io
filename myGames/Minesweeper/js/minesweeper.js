'use strict';
window.onload = function() {
    let mine = new MineSweeper();
    // mine.gameInit();
};

function MineSweeper() {
    this.mine = {
        boxSize: [10, 10], // 游戏 box 大小
        coord: [], // 所有地雷的坐标 [x, y]
        number: [], // 所有的数字的坐标及大小 [x, y, num]
        count: null, // 地雷个数
        hard: .15, // 地雷相对于总格子数的个数
        triggered: [], // 保存点击过的格子坐标信息
        search: [], // 自动翻开非雷区的记录数组
        queue: [], // 自动翻开非雷区的辅助队列
    };

    // 初始化雷的个数
    this.mine.count = Math.floor((this.mine.boxSize[0] * this.mine.boxSize[1]) * this.mine.hard); 
    
    return this.gameInit(); // 游戏初始化
}

// MineSweeper 的方法集合
(function() {
    // 游戏初始化
    MineSweeper.prototype.gameInit = function() {
        this.createBoxDiv();
        this.createMines();
        this.showAllMines();
        this.createNumber();
        this.showAllNumber();
        this.setGame();
    };

    // 根据坐标获得相对应的  game-box-div 元素的下标
    MineSweeper.prototype.getIndex = function(xy) {
        // 传入的参数转为数字类型，防止传入字符串出错
        xy[0] = parseInt(xy[0]);
        xy[1] = parseInt(xy[1]);
        return $('.game-box-div').eq(xy[0] + xy[1] * this.mine.boxSize[0]);
    }    

    // 创建游戏背景框架
    MineSweeper.prototype.createBoxDiv = function() {
        let {boxSize:[x,y]} = this.mine;
        // 创建一个总的游戏框
        let box = $('<div class="game-box"></div>');

        // 创建背景 “ 像素 ” 点
        for(let i = 0; i < y; i++) {
            for(let j = 0; j < x; j++) {
                let boxDiv = $('<div class="game-box-div"><div class="mine-div"></div></div>');
                boxDiv.attr('index', [j, i]); // 给每个格子添加 index 信息
                box.append(boxDiv);
            }

            // 清除浮动，换行
            let boxClear = $('<div class="clear"></div>');
            box.append(boxClear);
        }
        
        $('#app').append(box);
    };

    // 生成随机的地雷
    MineSweeper.prototype.createMines = function() {
        let obj = this.mine;
        let {boxSize:[x, y], count} = obj;
        for(let i = 0; i < count; i++) {
            // 随机生成 “ 地雷 ”
            do {
                // 随机坐标
                let mineX = Math.floor(Math.random() * x);
                let mineY = Math.floor(Math.random() * y);

                // 防止生成重叠的地雷
                if(!this.isMine([mineX, mineY])) {
                    obj.coord.push([mineX, mineY]); // push “ 地雷 ” 的坐标
                    break;
                }
            } while(1);
        }
    };

    // 显示所有地雷
    MineSweeper.prototype.showAllMines = function() {
        let obj = this.mine;
        let divs = $('.game-box-div');
        for(let i = 0; i < obj.coord.length; i++) {
            let xy = obj.coord[i]; // 当前地雷的坐标
            this.getIndex(xy).children('.mine-div').addClass('mine-danger');
        }
    };

    // 创建地雷周围的数字
    MineSweeper.prototype.createNumber = function() {
        let obj = this.mine;
        for(let i = 0; i < obj.coord.length; i++) {
            let xy = [obj.coord[i][0] - 1, obj.coord[i][1] - 1]; // 获取当前的地雷位置的左上角
            let [x, y] = xy;
            // 循环8次，计算每个地雷周围8个格子的数字
            for(let j = 0; j < 3; j++) {
                xy[0] = x; // 行坐标初始化
                for(let k = 0; k < 3; k++) {
                    // 若当前位置为地雷，则跳过这一次
                    if(k == 1 && j == 1) {
                        xy[0]++; // 行数 + 1
                        continue;
                    }

                    // 判断是否在游戏 box 的范围之内
                    if((xy[0] >= 0) && (xy[0] < obj.boxSize[0]) && (xy[1] >= 0) && (xy[1] < obj.boxSize[1])) {
                        // 判断该位置是否已经存在 number, 不存在则 = 1 ， 存在则 + 1
                        if(!obj.number.some((val, ii) => {
                            if([val[0], val[1]].toString() == xy.toString()) {
                                obj.number[ii][2]++;
                                return true;
                            }
                            return false;
                        })) {
                            if(!this.isMine(xy)) {
                                // 若不为地雷，则保存为 number 格子
                                obj.number.push([...xy, 1]);
                            }
                        }
                    }

                    xy[0]++; // 行坐标 + 1
                }

                xy[1]++; // 列坐标 + 1
            }
        }
    };

    // 显示一个地雷
    MineSweeper.prototype.showOneMine = function(xy) {
        this.getIndex(xy).html('<div class="mine-div mine-safe"></div>');
    }

    // 显示一个数字
    MineSweeper.prototype.showOneNumber = function(xy) {
        let obj = this.mine;
        for(let i = 0; i < obj.number.length; i++) {
            let [nx, ny, nn] = obj.number[i];
            if([nx, ny].toString() == xy.toString()) {
                this.getIndex(xy).html(nn);
                break;
            }
        }
    }

    // 显示一个空格
    MineSweeper.prototype.showOneBlank = function(xy) {
        this.getIndex(xy).html('');
    }

    // 显示所有数字
    MineSweeper.prototype.showAllNumber = function() {
        let obj = this.mine;
        for(let i = 0; i < obj.number.length; i++) {
            let [nx, ny, nn] = obj.number[i]; // 获取坐标值以及数值大小

            // 获取为数字的格子
            this.getIndex([nx, ny]).children('div').html(nn);
        }
    }

    // 用来判断 autoExtend 函数中，是否 push 到队列的函数
    MineSweeper.prototype.autoExtendIsPush = function(value) {
        if(this.getIndex(value).attr('flag') == 'false' && this.isInBox(value) && !this.isMine(value)) {
            if(!this.mine.queue.some((val) => {
                return val.toString() == value.toString();
            })) {
                this.mine.queue.push(value);
            }
        }
    }

    // 自动展开无雷区
    MineSweeper.prototype.autoExtend = function(xy) {
        // 当队列为空时，结束递归
        let x, y;
        if(xy) {
            [x, y] = [parseInt(xy[0]), parseInt(xy[1])];
        }
        else {
            return;
        }
        if(!this.isInBox([x, y])) {
            // 若递归到超出边界，则 return
            return;
        }
        else {
            // this.mine.queue.push([x, y]); // 压入队列
            if(this.getIndex([x, y]).attr('flag') == 'false') {
                this.mine.search.push([x, y]); // 第一次遍历的坐标 push 到信息数组

                // push 该坐标四周未被访问过的格子
                if(!this.isNumber([x, y])) {
                    let tempLeft = [x - 1, y];
                    let tempUp = [x, y - 1];
                    let tempRight = [x + 1, y];
                    let tempDown = [x, y + 1];
                    this.autoExtendIsPush(tempLeft);
                    this.autoExtendIsPush(tempUp);
                    this.autoExtendIsPush(tempRight);
                    this.autoExtendIsPush(tempDown);

                    // 现在为上下左右 4 个格子，可以扩展为周围 8 个格子
                }

                this.getIndex([x, y]).attr('flag', 'true'); // 遍历过的设置为 true
                return this.autoExtend(this.mine.queue.shift()); // 尾递归
            }
        }             
    }

    // 显示该区块
    // 参数：传入点击的坐标
    MineSweeper.prototype.showOne = function(xy) {
        if(this.isMine(xy)) {
            // 坐标为地雷
            this.showOneMine(xy);
        }
        else if(this.isNumber(xy)) {
            // 坐标为数字
            this.showOneNumber(xy);
        }
        else if(this.isNone(xy)) {
            // 坐标为空格
            // this.showOneBlank(xy);
            $('.game-box-div').attr('flag', 'false');
            this.autoExtend(xy);

            console.log('坐标：', this.mine.search)
            console.log('队列：', this.mine.queue)
        }
    }

    // 判断该坐标是否是地雷
    // 参数：传入点击的坐标
    MineSweeper.prototype.isMine = function(xy) {
        // 判断点击的坐标是否存在于 “ 地雷 ” 数组中
        return this.mine.coord.some((val) => {
            return val.toString() == xy.toString();
        });
    }

    // 判断该坐标是否是数字
    // 参数：传入点击的坐标
    MineSweeper.prototype.isNumber = function(xy) {
        // 判断点击的坐标是否存在于 “ number ” 数组中
        return this.mine.number.some(([vx, vy]) => {
            return [vx, vy].toString() == xy.toString();
        });
    }

    // 判断该坐标是否是空
    // 参数：传入点击的坐标
    MineSweeper.prototype.isNone = function(xy) {
        // 判断点击的坐标是否存在于 “ number ” 数组中
        return !this.mine.number.some(([vx, vy]) => {
            return [vx, vy].toString() == xy.toString();
        }) && !this.mine.coord.some((val) => {
            return val.toString() == xy.toString();
        });
    }

    // 判断该坐标的格子是否已经触发过
    MineSweeper.prototype.isTriggered = function(xy) {
        return this.mine.triggered.some((val) => {
            return val.toString() == xy.toString();
        });
    }

    // 判断是否在 game box 内部
    MineSweeper.prototype.isInBox = function(xy) {
        let [x, y] = [parseInt(xy[0]), parseInt(xy[1])];
        return (0 <= x && x < this.mine.boxSize[0] && 0 <= y && y < this.mine.boxSize[1]);
    }

    // 游戏结束画面
    MineSweeper.prototype.gameOver = function() {
        let obj = this.mine;
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
        let score = $(`<p>Your score is : ${2333}</p>`);

        // 重开游戏
        re.on('click', () => {   
            // this.gameInit(obj);
        })

        over.html('<h1>Game Over !</h1>').append(score, re);
        $('.game-box').append(over);
    }

    // 设置游戏
    MineSweeper.prototype.setGame = function() {
        let obj = this.mine;
        $('.game-box-div').on('click', (ev) => {
            ev = ev || window.event;

            // 左键点击时才触发
            if(ev.buttons == 0) {
                // 防止多次点击报错
                let div = ev.target.parentNode; // 获取到当前点击的格子的 index 属性
                div = div.className == 'game-box-div' ? div : ev.target;
                let index = $(div).attr('index').split(','); // 转换为坐标值

                // 防止多次触发
                if(!this.isTriggered(index)) {
                    this.showOne(index); // 展开非雷区
                    // this.showOne(index);
                    this.mine.triggered.push(index); // 标记点过的格子坐标信息
                }
                // if(this.isMine(index)) {
                //     this.gameOver(); // 游戏结束
                // }
                // else {
                //     ;
                // }
            }
        });

        // 阻止浏览器右键默认事件
        $('.game-box-div').on('contextmenu', (ev) => {
            ev = ev || window.event;
            ev.preventDefault();
        });

        // 鼠标按下触发
        $('.game-box-div').on('mousedown', (ev) => {
            ev = ev || window.event;

            // 左右键同时按下触发
            if(ev.buttons == 3) {
                ;
            }

            // 右键触发
            if(ev.buttons == 2) {
                // 添加问号
                let mark = $(ev.target);

                // 判断当前格子是否已经点开
                if(mark[0].className != 'game-box-div') {
                    if(!mark.attr('mark')) {
                        mark.attr('mark', true);
                        mark.html('?');
                    }
                    // 移除问号
                    else {
                        mark.removeAttr('mark');
                        mark.html('');
                    }
                }
            }
        });
    }

})();
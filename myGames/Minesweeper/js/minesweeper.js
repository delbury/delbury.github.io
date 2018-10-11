'use strict';
window.onload = function() {
    new MineSweeper();
    // mine.gameInit();
};

function MineSweeper() {
    this.mine = {
        boxSize: [20, 20], // 游戏 box 大小
        coord: [], // 所有地雷的坐标 [x, y]
        number: [], // 所有的数字的坐标及大小 [x, y, num]
        count: null, // 地雷个数
        hard: 10 / 400, // 地雷相对于总格子数的个数
        triggered: [], // 保存点击过的格子坐标信息
        search: [], // 自动翻开非雷区的记录数组
        queue: [], // 自动翻开非雷区的辅助队列
        reset: false, // 记录是否加载过
        timer: null, // 计时器
        startTime: null, // 记录游戏开始时间
        currentTime: null, // 记录游戏当前时间
        flagCount: null, // 记录右键放置标志的数量
    };

    // 初始化雷的个数
    this.mine.count = Math.floor((this.mine.boxSize[0] * this.mine.boxSize[1]) * this.mine.hard);
    this.mine.flagCount = this.mine.count;
    
    return this.gameInit(); // 游戏初始化
}

// MineSweeper 的方法集合
(function() {
    // 游戏初始化
    MineSweeper.prototype.gameInit = function() {   
        this.createBoxDiv(); // 绘制游戏背景
        if(!this.reset) {
            this.createBoxScore(); // 创建游戏分数栏
            this.reset = true;
        }

        // 阻止浏览器右键默认事件
        $('.game-box').on('contextmenu', (ev) => {
            ev = ev || window.event;
            ev.preventDefault();
        });
        
        // 绑定/解绑点击事件，实现第一次点击后才开始设置游戏
        $('.game-box').on('click', (ev) => {
            ev = ev || window.event;
            let index = $(ev.target.parentNode).attr('index');
            if(index) {
                this.mine.startTime = new Date(); // 记录游戏开始时间
                this.mine.timer = setInterval(() => {
                    // 定时刷新时间，间隔 1s
                    this.mine.currentTime = new Date();
                    $('.game-score .time span').html(this.formatTime());
                }, 1000);

                $('.game-box').off('click'); // 解绑该事件，只触发一次
                // 防止点击到边框误触发
                this.createMines(index.split(',')); // 布置游戏随机地雷
                this.createNumber(); // 生成地雷周围的数字
                this.setGame(); // 设置游戏，操作方法，胜败条件等

                // 实现第一次点击，完成游戏初始化后，并打开点击的格子
                // 左键点击时才触发
                if(ev.buttons == 0) {
                    // 防止多次点击报错
                    let div = ev.target.parentNode; // 获取到当前点击的格子的 index 属性
                    div = div.className == 'game-box-div' ? div : ev.target;
                    let index = $(div).attr('index'); // 转换为坐标值

                    // 防止多次触发
                    if(index && !this.isTriggered(index = index.split(','))) {
                        this.clickOne(index); // 展开非雷区
                        this.mine.triggered.push(index); // 标记点过的格子坐标信息

                        this.gameWin(); // 判断游戏是否胜利
                    }
                }
            }     
        });

    };

    MineSweeper.prototype.gameReset = function() {
        // 数据初始化
        this.mine.coord = [];
        this.mine.number = [];
        this.mine.triggered = [];
        this.mine.search = [];
        this.mine.queue = [];
        this.mine.flagCount = this.mine.count;

        // 初始化时间
        $('.game-score .time span').html('0'); 
        $('.game-score .mine span').html(this.mine.flagCount);
        if(this.mine.timer) {
            clearInterval(this.mine.timer);
            this.mine.timer = null;
        }

        $('.game-box').remove();
        this.gameInit();
    }

    // 根据坐标获得相对应的  game-box-div 元素的下标
    MineSweeper.prototype.getIndex = function(xy) {
        // 传入的参数转为数字类型，防止传入字符串出错
        xy[0] = parseInt(xy[0]);
        xy[1] = parseInt(xy[1]);
        return $('.game-box-div').eq(xy[0] + xy[1] * this.mine.boxSize[0]);
    }    

    // 创建游戏分数栏
    MineSweeper.prototype.createBoxScore = function() {
        let score = $(`<div class="game-score"><div class="time">Time: <span>0</sapn></div><div class="mine">Mine: <span>${this.mine.flagCount}</span></div></div>`); // 创建分数栏 div 元素
        let btn = $('<button>Reset</button>');
        btn.on('click', this.gameReset.bind(this));
        score.append(btn);
        let width = $('.game-box').outerWidth(); // 获取 game-box 包括边框的宽度
        score.css('width', width + 'px'); // 根据 game-box 宽度，动态设置分数栏的宽度

        $('.game-box').before(score);
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
    MineSweeper.prototype.createMines = function(startxy) {
        let obj = this.mine;
        let {boxSize:[x, y], count} = obj;
        for(let i = 0; i < count; i++) {
            // 随机生成 “ 地雷 ”
            do {
                // 随机坐标
                let mineX = Math.floor(Math.random() * x);
                let mineY = Math.floor(Math.random() * y);

                // 防止生成重叠的地雷
                if(!this.isMine([mineX, mineY]) && (startxy.toString() != [mineX, mineY].toString())) {
                    obj.coord.push([mineX, mineY]); // push “ 地雷 ” 的坐标
                    break;
                }
            } while(1);
        }
    };

    // 显示所有地雷
    MineSweeper.prototype.showAllMines = function(type) {
        let obj = this.mine;
        let divs = $('.game-box-div');
        for(let i = 0; i < obj.coord.length; i++) {
            let xy = obj.coord[i]; // 当前地雷的坐标
            this.getIndex(xy).children('.mine-div').addClass('mine-' + type);
        }
    };

    // 显示所有
    MineSweeper.prototype.showAll = function(type = 'danger') {
        this.showAllMines(type);
        this.showAllNumber();

        // 显示所有空格
        for(let i = 0; i < this.mine.boxSize[1]; i++) {
            for(let j = 0; j < this.mine.boxSize[0]; j++) {
                if(this.isNone([i, j])) {
                    this.getIndex([i, j]).html('');
                }
            }
        }
    }

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
    MineSweeper.prototype.showOneMine = function(xy, type = 'safe') {
        this.getIndex(xy).html(`<div class="mine-div mine-${type}"></div>`);
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

    // 显示一个格子
    MineSweeper.prototype.showOne = function(xy) {
        if(this.isNone(xy)) {
            this.showOneBlank(xy);
        }
        else if(this.isNumber(xy)) {
            this.showOneNumber(xy);
        }
        else if(this.isMine(xy)) {
            this.showOneMine(xy)
        }
    }

    // 显示所有数字
    MineSweeper.prototype.showAllNumber = function() {
        let obj = this.mine;
        for(let i = 0; i < obj.number.length; i++) {
            let [nx, ny, nn] = obj.number[i]; // 获取坐标值以及数值大小

            // 获取为数字的格子
            this.getIndex([nx, ny]).html(nn);
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

                // push 该坐标周围 8 个格子未被访问过的格子
                if(!this.isNumber([x, y])) {
                    this.autoExtendIsPush([x - 1, y]); // 左方坐标
                    this.autoExtendIsPush([x - 1, y - 1]); // 左上角坐标
                    this.autoExtendIsPush([x, y - 1]); // 上方坐标
                    this.autoExtendIsPush([x + 1, y - 1]); // 右上角坐标
                    this.autoExtendIsPush([x + 1, y]); // 右方坐标
                    this.autoExtendIsPush([x + 1, y + 1]); // 右下角坐标
                    this.autoExtendIsPush([x, y + 1]); // 下方坐标
                    this.autoExtendIsPush([x - 1, y + 1]); // 左下角坐标

                    // 现在为上下左右 4 个格子，可以扩展为周围 8 个格子
                }

                this.getIndex([x, y]).attr('flag', 'true'); // 遍历过的设置为 true
                return this.autoExtend(this.mine.queue.shift()); // 尾递归
            }
        }             
    }

    // 根据 search 数组内的信息展开格子
    MineSweeper.prototype.autoExtendShow = function() {
        let index = null;
        while(index = this.mine.search.pop()) {
            this.showOne(index);
        }
    };

    // 显示该区块
    // 参数：传入点击的坐标
    MineSweeper.prototype.clickOne = function(xy) {
        if(this.isMine(xy)) {
            // 坐标为地雷
            this.gameOver();
            this.showOneMine(xy, 'danger');     
        }
        else if(this.isNumber(xy)) {
            // 坐标为数字
            this.showOneNumber(xy);
        }
        else if(this.isNone(xy)) {
            // 坐标为空格
            $('.game-box-div').attr('flag', 'false'); // 标记所有格子的遍历属性 false
            this.autoExtend(xy);
            // console.log('坐标：', this.mine.search)
            // console.log('队列：', this.mine.queue)
            $('.game-box-div').removeAttr('flag'); // 移除所有格子的遍历属性
            this.autoExtendShow();
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

    // 游戏结束
    MineSweeper.prototype.gameOver = function(style = 'safe') {
        // 清空所有绑定时间
        $('.game-box').off('mousedown click');
        this.showAll(style);

        clearInterval(this.mine.timer); // 停止计时器
        this.mine.timer = null;
    }

    // 判断游戏是否胜利
    MineSweeper.prototype.isWin = function() {
        let mineDivs = $('.mine-div').length;
        if(mineDivs == this.mine.count) {
            return true;
        }
        return false;
    }

    // 时间格式化
    MineSweeper.prototype.formatTime = function() {
        let ms = Math.floor((this.mine.currentTime - this.mine.startTime) / 1000);
        return ms.toString();
    } 

    // 游戏胜利
    MineSweeper.prototype.gameWin = function() {
        if(this.isWin()) {
            this.mine.currentTime = new Date(); // 记录结束时间
            clearInterval(this.mine.timer); // 停止计时器
            this.mine.timer = null;

            // 清空所有绑定时间
            $('.game-box').off('mousedown click');
            this.showAll('safe');

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
            let score = $(`<p>Take time : ${this.formatTime()}</p>`);

            // 重开游戏
            re.on('click', () => {   
                this.gameReset();
            })

            over.html('<h1>You Won !</h1>').append(score, re);
            $('.game-box').append(over);
        }    
    }

    // 设置游戏
    MineSweeper.prototype.setGame = function() {
        $('.game-box').on('click', (ev) => {
            ev = ev || window.event;

            // 左键点击时才触发
            if(ev.buttons == 0) {
                // 防止多次点击报错
                let div = ev.target.parentNode; // 获取到当前点击的格子的 index 属性
                div = div.className == 'game-box-div' ? div : ev.target;
                
                let index = $(div).attr('index');

                // 防止多次触发
                if(index && !this.isTriggered(index = index.split(','))) {
                    this.clickOne(index); // 展开非雷区
                    this.mine.triggered.push(index); // 标记点过的格子坐标信息

                    // this.gameWin(); // 判断游戏是否胜利
                }
            }
        });

        // 鼠标按下触发
        $('.game-box').on('mousedown', (ev) => {
            ev = ev || window.event;
            // 左右键同时按下触发
            if(ev.buttons == 3 && ev.target.className == 'game-box-div') {
                let index = $(ev.target).attr('index').split(',');
                this.setClickStyle(index, '#888');

                // 设置监听左右键同时按下后松开事件
                $(document).on('mouseup', () => {
                    this.setClickStyle(index);
                    $(document).off('mouseup');
                });
            }

            // 右键触发
            if(ev.buttons == 2 && ev.button == 2) {
                // 添加问号
                let mark = $(ev.target);

                // 判断当前格子是否已经点开
                if(mark[0].className != 'game-box-div') {
                    if(!mark.attr('mark')) {
                        mark.attr('mark', true);
                        mark.html('!');
                        this.mine.flagCount--;
                    }
                    // 移除问号
                    else {
                        mark.removeAttr('mark');
                        mark.html('');
                        this.mine.flagCount++;
                    }

                    $('.game-score .mine span').html(this.mine.flagCount); // 更新剩余地雷数
                }
            }
        });
    }

    // 设置坐标周围八个位置上 div 的样式
    MineSweeper.prototype.setClickStyle = function(xy, color = '') {
        let [x, y] = [parseInt(xy[0] - 1), parseInt(xy[1]) - 1];
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                // 跳过自身的坐标
                if(i == 1 && j == 1) {
                    continue;
                }
                if(this.isInBox([x + j, y + i])) {
                    let div = this.getIndex([x + j, y + i]);

                    // 筛选出正确的格子
                    if(div.html() != '' && isNaN(div.html())) {
                        div.children('div').css('background-color', color);
                    }
                }
            }
        }
    }
})();
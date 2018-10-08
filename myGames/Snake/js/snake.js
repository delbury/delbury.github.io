window.onload = function() {
    gameInit(); // 初始化游戏
};

function Snake(obj) {
    this.timer = obj.timer; // 定时器
    this.dir = obj.dir; // 当前运动方向
    this.dirSet = obj.dirSet; // 下一次运动方向
    this.boxSize = obj.boxSize; // 游戏 box 大小
    this.coord = obj.coord; // snake 坐标，头部 --> 尾部
    this.food = obj.food; // food 坐标
    this.speed = obj.speed; // 运动速度
}

// 游戏初始化
function gameInit() {
    window.snake = new Snake({
        timer: null,
        dir: 'right',
        dirSet: '',
        boxSize: [30, 20],
        coord: [[3,4], [2,4], [1,4]],
        speed: 200,
    });
    
    $('#app').html(''); // 初始化界面
    createBoxDiv(snake);
    gameStart(snake);
}

// 创建游戏背景框架
function createBoxDiv({boxSize:[x,y]}) {
    // 创建一个总的游戏框
    let box = $('<div class="game-box"></div>');

    // 创建背景 “ 像素 ” 点
    for(let i = 0; i < y; i++) {
        for(let j = 0; j < x; j++) {
            let boxDiv = $('<div class="game-box-div"></div>');
            boxDiv.attr('index', [i, j]);
            box.append(boxDiv);
        }

        // 清除浮动，换行
        let boxClear = $('<div class="clear"></div>');
        box.append(boxClear);
    }
    
    $('#app').append(box);
}

// 创建 “ 蛇 ” 
// 传入 box尺寸数组，以及 snake 的位置数组
function createSnake(obj) {
    let {boxSize:size, coord:[head, ...body]} = obj;
    let divs = $('.game-box-div');
    // divs.html(''); // 重置 box
    divs.eq(head[0] + head[1] * size[0]).html('<div class="snake-head"></div>'); // 计算获得对应坐标的元素
    for(let i = 0; i < body.length; i++) {
        let temp = body[i];
        divs.eq(temp[0] + temp[1] * size[0]).html('<div class="snake-body"></div>');
    }
}

// “ 蛇 ” 的移动
// 参数：snake 对象；速度参数
function moveSnake(obj) {
    let {boxSize:size, coord: xy} = obj;
    obj.timer = setInterval(() => {
        if(obj.dirSet) {
            obj.dir = obj.dirSet;
            obj.dirSet = '';
        }
        // 判断方向
        let newHead = null;
        switch(obj.dir) {
            case 'left': newHead = [xy[0][0] - 1, xy[0][1]]; break;
            case 'up': newHead = [xy[0][0], xy[0][1] - 1]; break;
            case 'right': newHead = [xy[0][0] + 1, xy[0][1]]; break;
            case 'down': newHead = [xy[0][0], xy[0][1] + 1]; break;
            default: break;
        }
        if(newHead) {
            xy.unshift(newHead); // 插入新的蛇头

            // 判断是否吃到 food
            if(isEatFood(obj)) {
                if(obj.speed >= 100) {
                    // 加快运动速度
                    clearInterval(obj.timer);
                    obj.speed -= 50;
                    moveSnake(obj);
                }        

                createFood(obj);
            }
            else if(!isGameOver(obj)) {
                let tail = xy.pop(); // 删除蛇尾巴

                // 清除删除的 tail 样式
                $('.game-box-div').eq(tail[0] + tail[1] * obj.boxSize[0]).html('');
            }

            // 判断是否游戏结束
            if(isGameOver(obj)) {
                clearInterval(obj.timer); // 清除定时器
                gameOver(obj);
                return;
            }
            else {
                createSnake(obj); // 重新绘制 snake
            }
        } 
    }, obj.speed);
}

// 控制 “ 蛇 ” 的移动
function dirSnake(obj) {
    // 改变方向标志变量内的值
    document.addEventListener('keydown', (ev) => {
        ev = ev || window.event;

        if(ev.keyCode >= 37 && ev.keyCode <= 40) {
            // 控制方向，只能 “ 左右 ” 转弯
            if(obj.dir == 'up' || obj.dir == 'down') {
                switch(ev.keyCode) {
                    case 37: obj.dirSet = 'left'; break;
                    case 39: obj.dirSet = 'right'; break;
                    default: break;
                }
            }
            else if(obj.dir == 'right' || obj.dir == 'left') {
                switch(ev.keyCode) {
                    case 38: obj.dirSet = 'up'; break;
                    case 40: obj.dirSet = 'down'; break;
                    default: break;
                }
            }

            // 处理转向的细节问题
            if(obj.dirSet == obj.dir || (obj.dir == 'down' && obj.dirSet == 'up')
            || (obj.dir == 'up' && obj.dirSet == 'down')
            || (obj.dir == 'left' && obj.dirSet == 'right')
            || (obj.dir == 'right' && obj.dirSet == 'left')) {
                obj.dirSet = '';
            }
            ev.preventDefault(); // 阻止浏览器默认事件
        }
    })
}

// 生成 “ 食物 ”
function createFood(obj) {
    do {
        // 生成随机坐标
        let foodX = Math.floor(Math.random() * obj.boxSize[0]);
        let foodY = Math.floor(Math.random() * obj.boxSize[1]);
        
        // 防止坐标重叠
        if(!obj.coord.some((val) => {
            if(val[0] == foodX && val[1] == foodY) {
                return true;
            }
        })) {
            // 清楚旧 food
            // if(obj.food.length != 0) {
            //     $('.game-box-div').eq(obj.food[0] + obj.food[1] * obj.boxSize[0]).html('');
            // }

            // 生成新 food
            obj.food = [foodX, foodY];
            let newFood = $('.game-box-div').eq(foodX + foodY * obj.boxSize[0]);
            newFood.html('<div class="snake-food"></div>');

            break;
        }
    }while(1);
}

// 获得食物
function isEatFood(obj) {
    let {coord:[head], food} = obj;
    if(head.toString() == food.toString()) {
        return true;
    }
    return false;
}

// 判断是否游戏结束
function isGameOver(obj) {
    let {coord: [head, ...body]} = obj;
    if(head[0] < 0 || head[0] >= obj.boxSize[0] || head[1] < 0 || head[1] >= obj.boxSize[1]) {
        // 判断蛇头是否超出边界
        return true;
    }
    if(body.some((val) => {
        return head.toString() == val.toString();
    })) {
        // 判断是否撞到自己的身体
        return true;
    }
    return false;
}

// 游戏结束
function gameOver(obj) {
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
    let score = $(`<p>Your score is : ${obj.coord.length - 1}</p>`);
    // 重开游戏
    re.on('click', () => {
        gameInit(obj);
    })

    over.html('<h1>Game Over !</h1>').append(score, re);
    $('.game-box').append(over);
}

// 游戏开始
function gameStart(obj) {
    let boxHeight = $('.game-box').innerHeight(); // game box 的高度
    let boxWidth = $('.game-box').innerWidth(); // game box 的宽度
    let setHeight = boxHeight * .75; // 弹出框的高度
    let setWidth = boxWidth * .75; // 弹出框的宽度
    let over = $('<div class="game-start"></div>');

    // 将弹出框设置居中
    over.css({
        'height': setHeight + 'px',
        'width': setWidth + 'px',
        'top': (boxHeight - setHeight) / 2 + 'px',
        'left': (boxWidth - setWidth) / 2 + 'px',
    });

    // 创建弹出框的内容
    let re = $('<a href="javascript: void(0);">Start the game</a>');

    over.append(re);

    // 点击事件
    over.on('click', function() {
        $(this).remove();

        //执行游戏
        createSnake(snake);
        createFood(snake);
        dirSnake(snake);
        moveSnake(snake);
    });
    $('.game-box').append(over);
}
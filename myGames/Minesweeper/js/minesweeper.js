window.onload = function() {
    let mine = new MineSweeper();
    // mine.gameInit();
};

function MineSweeper() {
    this.mine = {
        boxSize: [20, 20], // 游戏 box 大小
        coord: [], // 所有地雷的坐标 [x, y]
        number: [], // 所有的数字的坐标及大小 [x, y, num]
        count: null, // 地雷个数
        hard: .1, // 地雷相对于总格子数的个数
    };

    // 初始化雷的个数
    this.mine.count = Math.floor((this.mine.boxSize[0] * this.mine.boxSize[1]) * this.mine.hard); 
    
    return this.gameInit(); // 游戏初始化
}

// MineSweeper 的方法集合
(function() {
    // 游戏初始化
    MineSweeper.prototype.gameInit = function() {
        this.createBoxDiv(this.mine);
        this.createMines(this.mine);
        this.showAllMines(this.mine);
        this.createNumber(this.mine);
        this.showAllNumber(this.mine);
        this.setGame(this.mine);
    };

    // 创建游戏背景框架
    MineSweeper.prototype.createBoxDiv = function({boxSize:[x,y]}) {
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
    MineSweeper.prototype.createMines = function(obj) {
        let {boxSize:[x, y], count} = obj;
        for(let i = 0; i < count; i++) {
            // 随机生成 “ 地雷 ”
            do {
                // 随机坐标
                let mineX = Math.floor(Math.random() * x);
                let mineY = Math.floor(Math.random() * y);

                // 防止生成重叠的地雷
                if(obj.coord.every((val) => {
                    return val.toString() != [mineX, mineY].toString();
                })) {
                    obj.coord.push([mineX, mineY]); // push “ 地雷 ” 的坐标
                    break;
                }
            } while(1);
        }
    };

    // 显示所有地雷
    MineSweeper.prototype.showAllMines = function(obj) {
        let divs = $('.game-box-div');
        for(let i = 0; i < obj.coord.length; i++) {
            let xy = obj.coord[i]; // 当前地雷的坐标
            divs.eq(xy[0] + xy[1] * obj.boxSize[0]).children('.mine-div').addClass('mine-danger');
        }
    };

    // 创建地雷周围的数字
    MineSweeper.prototype.createNumber = function(obj) {
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
                        // 判断该位置是否已经存在 number
                        let index = null;
                        if(!obj.number.some((val, ii) => {
                            if([val[0], val[1]].toString() == xy.toString()) {
                                obj.number[ii][2]++;
                                return true;
                            }
                            return false;
                        })) {
                            if(!obj.coord.some((val) => {
                                return val.toString() == xy.toString();
                            })) {
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

    // 显示所有数字
    MineSweeper.prototype.showAllNumber = function(obj) {
        let divs = $('.game-box-div');
        for(let i = 0; i < obj.number.length; i++) {
            let [nx, ny, nn] = obj.number[i]; // 获取坐标值以及数值大小

            // 获取为数字的格子
            divs.eq(nx + ny * obj.boxSize[0]).children('div').html(nn);
        }
    }

    // 游戏结束画面
    MineSweeper.prototype.gameOver = function(obj) {
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
    MineSweeper.prototype.setGame = function(obj) {
        $('.game-box-div').on('click', (ev) => {
            ev = ev || window.event;
            let div = ev.target.parentNode; // 获取到当前点击的格子的 index 属性
            let index = $(div).attr('index');
            if(obj.coord.some((val) => {
                return val.toString() == index;
            })) {
                this.gameOver(obj);
            }
            else {
                ;
            }
        });
    }

})();
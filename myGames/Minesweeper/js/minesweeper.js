window.onload = function() {
    let mine = new MineSweeper();
    // mine.gameInit();
};

function MineSweeper() {
    this.mine = {
        boxSize: [20, 20],
    };
    return this.gameInit();
}

MineSweeper.prototype = (function() {
    // 游戏初始化
    gameInit = function() {
        createBoxDiv(this.mine);
    };

    // 创建游戏背景框架
    createBoxDiv = function({boxSize:[x,y]}) {
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
    };

    // 返回可调用函数集合的对象
    return ({
        gameInit,
    });
})();
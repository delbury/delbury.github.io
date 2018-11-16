/*
 * 基于 node.js 服务器代理获取 bilibili 哔哩哔哩后台数据
 * Author: DelBury
 */

const express = require('express');
const app = express();
const request = require('request');
const assert = require('assert');
const fs = require('fs');
const cheerio = require('cheerio');

const localhost = 'http://127.0.0.1:3000';

app.use(express.static('./download'))

/************************************************ */
// 获取 search 默认值
/************************************************ */
app.get('/bili/search', (req, res) => {
  // setting
  let options = {
    url: 'https://api.bilibili.com/x/web-interface/search/default',
    headers: {
      // 'Referer': 'http://127.0.0.1:8080/'
      'Cookie': 'buvid3=EBA0BC95-53A2-460B-83F4-F504E3C678E851819infoc; LIVE_BUVID=AUTO5615414709643363',
    },
  };

  // get request
  request.get(options, (err, resp, body) => {
    assert(err == null);
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);   
  })
});

/************************************************ */
// 获取直播的热门活动
/************************************************ */
app.get('/bili/getactivities', (req, res) => {
  // setting
  let options = {
    url: 'https://api.live.bilibili.com/room_ex/v1/Banner/getNewBanner?platform=1&position=0&userPlatform=web&userdevice=browser',
    headers: {
      'Cookie': 'buvid3=EBA0BC95-53A2-460B-83F4-F504E3C678E851819infoc; LIVE_BUVID=AUTO5615414709643363; finger=edc6ecda',
    },
  };

  // get request
  request.get(options, (err, resp, body) => {
    assert(err == null);
    let resdata = JSON.parse(body); // 获取的数据转为对象
    let ext = resdata.data[0].img.match(/\.\w+$/i)[0]; // 获取扩展名
    let saveurl = '/activity' + ext;
    
    getimg(resdata.data[0].img, saveurl, () => {
      res.header('Access-Control-Allow-Origin', '*');
      resdata.data[0].localimg = localhost + saveurl;
      res.send(resdata);
    });
  });
});

/************************************************ */
// 获取热门直播列表
/************************************************ */
app.get('/bili/gethotlist', (req, res) => {
  // setting
  let options = {
    url: 'https://api.live.bilibili.com/room/v1/Index/getHotList',
    headers: {
      'Cookie': 'buvid3=EBA0BC95-53A2-460B-83F4-F504E3C678E851819infoc; LIVE_BUVID=AUTO5615414709643363; finger=edc6ecda',
    },
  }

  // get request
  request.get(options, (err, resp, body) => {
    assert(err == null);
    let resdata = JSON.parse(body); // 获取的数据转为对象
    let listlength = resdata.data.list.length; // 获取数据长度

    for(let [index, item] of resdata.data.list.entries()) {
      // 获取全部图片
      let ext = item.face.match(/\.\w+$/i)[0]; // 获取扩展名
      let saveurl = '/hotlist' + index + ext; // 相对于 /temp 的保存路径

      getimg(item.face, saveurl, () => {
        item.localface = localhost + saveurl; // 插入数据
        listlength--;
        if(listlength == 0) {
          // 返回前端数据
          res.header('Access-Control-Allow-Origin', '*');
          res.send(resdata);
        }
      })
    }
  });

});

/************************************************ */
// 获取游戏中心的数据
/************************************************ */
app.get('/bili/getgamecenter', (req, res) => {
  // setting
  let options = {
    url: 'https://www.bilibili.com/page-proxy/game-nav.html',
    headers: {
      'Cookie': 'buvid3=EBA0BC95-53A2-460B-83F4-F504E3C678E851819infoc; LIVE_BUVID=AUTO5615414709643363;'
        + ' finger=edc6ecda; _uuid=17C9B956-8D75-76CC-9888-3846B740B0F369840infoc; fts=1541654058',
    },
  }

  // get request
  request.get(options, (err, resp, body) => {
    let $ = cheerio.load(body);
    let listtext = $('.right .all a span');
    let listimg = $('.right .all a');
    let listlength = listtext.length;
    let data = [];
    let counter = listlength;

    // 获取 banner 数据
    let bannerData = {};
    let bannerDone = false;
    let banner = $('.left .banner a img');
    bannerData.link = $('.left .banner a').attr('href');
    bannerData.img = banner.attr('src');
    bannerData.text = banner.attr('alt');

    // 获取图片
    let ext = bannerData.img.match(/\.\w+$/i)[0]; // 获取扩展名
    let saveurl = '/banner' + ext; 

    // 发送请求
    getimg('https:' + bannerData.img, saveurl, () => {
      bannerData.localimg = localhost + saveurl; // 插入数据
      bannerDone = true; // 标志已获取 banner 图片数据
      if(counter == 0 && bannerDone && briefsLength == 0) {
        // 返回前端数据
        res.header('Access-Control-Allow-Origin', '*');
        res.send({
          list: data,
          banner: bannerData,
          brief: briefData,
        });
        return;
      }
    })

    // 获取 brief 数据
    let briefData = [];
    let briefs = $('.left .brief a');
    let briefsLength = briefs.length;

    // 初始化数据
    for(let i = 0; i < briefs.length; i++) {
      briefData[i] = {}
    }
    // 获取图片
    for(let i = 0; i < briefs.length; i++) {
      briefData[i].id = i;
      briefData[i].text = briefs.eq(i).attr('title');
      briefData[i].img = briefs.eq(i).find('img').attr('src');
      briefData[i].link = briefs.eq(i).attr('href');

      // 获取图片
      let ext = briefData[i].img.match(/\.\w+$/i)[0]; // 获取扩展名
      let saveurl = '/brief' + i + ext; 

      // 发送请求
      getimg('https:' + briefData[i].img, saveurl, () => {
        briefData[i].localimg = localhost + saveurl; // 插入数据
        briefsLength--;
        if(counter == 0 && bannerDone && briefsLength == 0) {
          // 返回前端数据
          res.header('Access-Control-Allow-Origin', '*');
          res.send({
            list: data,
            banner: bannerData,
            brief: briefData,
          });
          return;
        }
      });
    }


    // 获取 list 数据
    // 初始化数据数量
    for(let i = 0; i < listlength; i++) {
      // 添加空对象
      data[i] = {};
    } 

    // 解析重组数据
    for(let i = 0; i < listlength; i++) {
      data[i].id = i;
      data[i].text = listtext.eq(i).text();
      data[i].img = listimg.eq(i).attr('data-img');
      data[i].link = listimg.eq(i).attr('href');

      // 获取图片
      let ext = data[i].img.match(/\.\w+$/i)[0]; // 获取扩展名
      let saveurl = '/gamelist' + i + ext; 

      // 发送请求
      getimg('https:' + data[i].img, saveurl, () => {
        data[i].localimg = localhost + saveurl; // 插入数据
        counter--;
        if(counter == 0 && bannerDone && briefsLength == 0) {
          // 返回前端数据
          res.header('Access-Control-Allow-Origin', '*');
          res.send({
            list: data,
            banner: bannerData,
            brief: briefData,
          });
          return;
        }
      });

    }  
  });
});
 

/************************************************ */
// 监听端口
app.listen(3000, () => console.log('started !'));
/************************************************ */

// 获取连接中的图片
function getimg(url, saveurl, cb) {
  if(!fs.existsSync('./download')) {
    fs.mkdirSync('./download');
  }
  let writeStream = fs.createWriteStream('./download' + saveurl);
  let readStream = request(url);
  readStream.pipe(writeStream);
  readStream.on('end', function() {
    // 下载完成
  });

  readStream.on('error', function() {
    console.log("错误信息:" + err)
  })

  writeStream.on("finish", function() {
    // 写入完成
    writeStream.end();

    // 回调
    cb();
  });
}
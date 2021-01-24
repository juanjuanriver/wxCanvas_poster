
let index = 0, // 当前点击图片的index
items = [], // 图片数组信息
itemId = 1; // 图片id，用于识别点击图片
var hCw = 1; // 图片宽高比
const maskCanvas = wx.createCanvasContext('maskCanvas', this); // 创建 canvas 的绘图上下文 CanvasContext 对象

Page({ 
  /**
   * 页面的初始数据
   */
  data: {
    itemList: [],
    showFliters: false, // 默认不显示过滤效果框
    showShapes: false, // 默认不显示形状效果框
    width: '200',
    height: '250',
    posterBg:'/images/bg.jpg'
  },
/**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) { 
  },
    /**
 * 生命周期函数--监听页面显示
 */
onShow: function () {
  this.initItem();
},

initItem() {
  itemId = 0;//清除重拍前的itemId
  items = this.data.itemList;//不频繁的setData，只需处理items，之后再this.setData（｛itemLits: items｝）
  this.getimginfo(this.data.posterBg); 
},
//获取海报背景图信息
getimginfo(url) {
  wx.getImageInfo({
    src: url,
    success: res => {
      this.setData({
        originalW: res.width,//海报图片原始宽度
        originalH: res.height,//海报图片原始高度
      }, function () {
        hCw = res.height / res.width
        wx.getSystemInfo({
          success: obj => {
            this.setData({
              // windowWidth-可使用窗口高度，即：屏幕高度(screenHeight) - 导航(tabbar)高度
              width:obj.windowWidth - 50 ,
              height: obj.windowWidth * hCw - 61,
            })
            this.setData({ canvasWidth: this.data.width, canvasHeight: this.data.height })
          }
        })
      })
    }
  })
},
//更换背景
changebg(){
  var that = this;
  wx.navigateTo({
    url: '../cropper/cropper',
  })
  items = [];
  this.setData({
    itemList: items
  })
},
  // 上传图片
  uploadImg() {
    let that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success (res) { 
        that.setDropItem({
          url: res.tempFilePaths[0]
        });
      }
    })
  },
  // 设置图片的信息
  setDropItem(imgData) {
    let data = {}; // 存储图片信息
    // 获取图片信息，网络图片需先配置download域名才能生效
    wx.getImageInfo({
      src: imgData.url,
      success: res => {
        // 初始化数据
        let maxWidth = 50, maxHeight = 50; // 设置最大宽高
        if (res.width > maxWidth || res.height > maxHeight) { // 原图宽或高大于最大值就执行
            if (res.width / res.height > maxWidth / maxHeight) { // 判断比例使用最大值的宽或高作为基数计算
                data.width = maxWidth;
                data.height = Math.round(maxWidth * (res.height / res.width));
            } else {
                data.height = maxHeight;
                data.width = Math.round(maxHeight * (res.width / res.height));
            }   
        }
        data.image = imgData.url; // 显示地址
        data.initImage = imgData.url; // 原始地址
        data.id = ++itemId; // id
        data.top = 0; // top定位
        data.left = 0; // left定位
        // 圆心坐标
        data.x = data.left + data.width / 2;
        data.y = data.top + data.height / 2;
        data.scale = 1; // scale缩放
        data.rotate = 1; // 旋转角度
        data.oScale = 1; //方向缩放
        data.angle = 0; //旋转角度，不定义的话，真机不旋转就不会出现
        data.active = false; // 选中状态
        items[items.length] = data; // 每增加一张图片数据增加一条信息
        this.setData({
          itemList: items
        })
      }
    })
  },
  //点击海报区域去掉图标上的框
  removeIcon() {
    for (let i = 0; i < items.length; i++) {
      items[i].active = false;
    }
    this.setData({
      itemList: items
    })
  },
  // 点击图片
  WraptouchStart: function(e) {
    // 循环图片数组获取点击的图片信息
    for (let i = 0; i < items.length; i++) {
      items[i].active = false;
      if (e.currentTarget.dataset.id == items[i].id) {
        index = i;
        items[index].active = true;
      }
    }
    this.setData({
      itemList: items
    })
 
    // 获取点击的坐标值
    items[index].lx = e.touches[0].clientX;
    items[index].ly = e.touches[0].clientY;
  },
  // 拖动图片
  WraptouchMove(e) {
    items[index]._lx = e.touches[0].clientX;
    items[index]._ly = e.touches[0].clientY;
 
    items[index].left += items[index]._lx - items[index].lx;
    items[index].top += items[index]._ly - items[index].ly;
    items[index].x += items[index]._lx - items[index].lx;
    items[index].y += items[index]._ly - items[index].ly;
 
    items[index].lx = e.touches[0].clientX;
    items[index].ly = e.touches[0].clientY;
 
    this.setData({
      itemList: items
    })
  },
  // 放开图片
  WraptouchEnd() {
    this.synthesis(); // 调用合成图方法
  },
  // 点击伸缩图标
  oTouchStart(e) {
    //找到点击的那个图片对象，并记录
    for (let i = 0; i < items.length; i++) {
      items[i].active = false;
      if (e.currentTarget.dataset.id == items[i].id) {
        index = i;
        items[index].active = true;
      }
    }
    //获取作为移动前角度的坐标
    items[index].tx = e.touches[0].clientX;
    items[index].ty = e.touches[0].clientY;
    //移动前的角度
    items[index].anglePre = this.countDeg(items[index].x, items[index].y, items[index].tx, items[index].ty);
    //获取图片半径
    items[index].r = this.getDistancs(items[index].x, items[index].y, items[index].left, items[index].top);
  },
  oTouchMove: function(e) {
    //记录移动后的位置
    items[index]._tx = e.touches[0].clientX;
    items[index]._ty = e.touches[0].clientY;
    //移动的点到圆心的距离
    items[index].disPtoO = this.getDistancs(items[index].x, items[index].y, items[index]._tx, items[index]._ty - 10)
 
    items[index].scale = items[index].disPtoO / items[index].r;
    items[index].oScale = 1 / items[index].scale;
 
    //移动后位置的角度
    items[index].angleNext = this.countDeg(items[index].x, items[index].y, items[index]._tx, items[index]._ty)
    //角度差
    items[index].new_rotate = items[index].angleNext - items[index].anglePre;
 
    //叠加的角度差
    items[index].rotate += items[index].new_rotate;
    items[index].angle = items[index].rotate; //赋值
 
    //用过移动后的坐标赋值为移动前坐标
    items[index].tx = e.touches[0].clientX;
    items[index].ty = e.touches[0].clientY;
    items[index].anglePre = this.countDeg(items[index].x, items[index].y, items[index].tx, items[index].ty)
 
    //赋值setData渲染
    this.setData({
      itemList: items
    })
  },
  // 计算坐标点到圆心的距离
  getDistancs(cx, cy, pointer_x, pointer_y) {
    var ox = pointer_x - cx;
    var oy = pointer_y - cy;
    return Math.sqrt(
      ox * ox + oy * oy
    );
  },
  /*
   *参数cx和cy为图片圆心坐标
   *参数pointer_x和pointer_y为手点击的坐标
   *返回值为手点击的坐标到圆心的角度
   */
  countDeg: function(cx, cy, pointer_x, pointer_y) {
    var ox = pointer_x - cx;
    var oy = pointer_y - cy;
    var to = Math.abs(ox / oy);
    var angle = Math.atan(to) / (2 * Math.PI) * 360;
    if (ox < 0 && oy < 0) //相对在左上角，第四象限，js中坐标系是从左上角开始的，这里的象限是正常坐标系  
    {
      angle = -angle;
    } else if (ox <= 0 && oy >= 0) //左下角,3象限  
    {
      angle = -(180 - angle)
    } else if (ox > 0 && oy < 0) //右上角，1象限  
    {
      angle = angle;
    } else if (ox > 0 && oy > 0) //右下角，2象限  
    {
      angle = 180 - angle;
    }
    return angle;
  },
  deleteItem: function(e) {
    let newList = [];
    for (let i = 0; i < items.length; i++) {
      if (e.currentTarget.dataset.id != items[i].id) {
        newList.push(items[i])
      }
    }
    if (newList.length > 0) {
      newList[newList.length - 1].active = true; // 剩下图片组最后一个选中
    }
    items = newList;
    this.setData({
      itemList: items
    })
  },
  // 打开遮罩层
  openMask() {
    this.synthesis();
    this.setData({ showCanvas: true })
  },
  synthesis() { // 合成图片
    console.log(this.data.originalW,this.data.originalH)
    let { posterBg,originalW, originalH, canvasWidth, canvasHeight}=this.data
    maskCanvas.save();
    maskCanvas.beginPath(); 
    maskCanvas.setFillStyle('#fff'); 
    maskCanvas.fillRect(0, 0, canvasWidth, canvasHeight);
    maskCanvas.drawImage(posterBg, 0, 0, originalW, originalH, 0, 0, canvasWidth, canvasHeight);
   
    items.forEach((currentValue, index) => {
      maskCanvas.save();
      maskCanvas.translate(0, 0);
      maskCanvas.beginPath();
      maskCanvas.translate(currentValue.x, currentValue.y); // 圆心坐标
      maskCanvas.rotate(currentValue.angle * Math.PI / 180);
      maskCanvas.translate(-(currentValue.width * currentValue.scale / 2), -(currentValue.height * currentValue.scale / 2))
      maskCanvas.drawImage(currentValue.image, 0, 0, currentValue.width * currentValue.scale, currentValue.height * currentValue.scale);
      maskCanvas.restore();
    })
    // reserve 参数为 false，则在本次调用绘制之前 native 层会先清空画布再继续绘制
    maskCanvas.draw(false, (e) => {
      wx.canvasToTempFilePath({
        canvasId: 'maskCanvas',
        success: res => {
          this.setData({
            canvasTemImg: res.tempFilePath
          })
        }
      }, this);
    })
  },
   
  // 关闭遮罩层
  disappearCanvas() {
    this.setData({
      showCanvas: false
    })
  },
  // 保存图片到系统相册
  saveImg: function() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.canvasTemImg,
      success: res => {
        wx.showToast({
          title: '保存成功',
          icon: "success"
        })
      },
      fail: res => {
        wx.openSetting({
          success: settingdata => {
            if (settingdata.authSetting['scope.writePhotosAlbum']) {
              console.log('获取权限成功，给出再次点击图片保存到相册的提示。')
            } else {
              console.log('获取权限失败，给出不给权限就无法正常使用的提示')
            }
          },
          fail: error => {
            console.log(error)
          }
        })
        wx.showModal({
          title: '提示',
          content: '保存失败，请确保相册权限已打开',
        })
      }
    })
  }
})
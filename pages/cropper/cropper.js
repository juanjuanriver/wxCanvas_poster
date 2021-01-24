//获取应用实例
const app = getApp()
Page({
  data: {
    src: '',
    width: 200, //宽度
    height: 250, //高度
    limit_move: false, //是否限制移动

  },
  onLoad: function(options) {
    this.cropper = this.selectComponent("#image-cropper");
    this.cropper.upload(); //上传图片
  },
  cropperload(e) {
    // console.log('cropper初始化完成');
  },
  loadimage(e) {
    wx.hideLoading();
    // console.log('图片加载完成,返回值');
    this.cropper.imgReset();
  },
  clickcut(e) {
    console.log(e.detail);
    //图片预览-点击中间裁剪框
    wx.previewImage({
      current: e.detail.url, // 当前显示图片的http链接
      urls: [e.detail.url] // 需要预览的图片http链接列表
    })
  },
  upload() {
    let that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showLoading({
          title: '加载中',
        })
        const tempFilePaths = res.tempFilePaths[0];
        //重置图片角度、缩放、位置
        that.cropper.imgReset();
        that.setData({
          src: tempFilePaths
        });
      }
    })
  },
  submit() {
    this.cropper.getImg((obj) => {
      // console.log(obj.url)
        var pages = getCurrentPages();
        var currPage = pages[pages.length - 1]; //当前页面
        var prevPage = pages[pages.length - 2]; //上一个页面
        //直接调用上一个页面对象的setData()方法，把数据存到上一个页面中去
        prevPage.setData({
          posterBg: obj.url
        });
        wx.navigateBack({
          delta: 1
        })
    });
  },
})
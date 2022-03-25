 auto.waitFor();
 init去限制();

 //配置 
 var weiboUID = ["7748094359"];
 var serverAddress = "192.168.1.10:8008";
 var ImageDir = "/sdcard/autoImage/";
 files.ensureDir(ImageDir);


 goBackToMain();
 while (true) {
     sleep(5000);
     for (var u = 0; u < weiboUID.length; u++) {
         var tasks = getTask(weiboUID[u]);
         if (tasks == null) {
             continue
         }
         for (var i = 0; i < tasks.length; i++) {
             var task = tasks[i];
             console.log(task)
                 //home();
             for (var j = 0; j < 3; j++) {
                 var success = true;
                 //开始执行前，先下载素材，重启微博
                 deleteAllMedia();
                 //下载图片
                 for (var m = 0; m < task.files.length; m++) {
                     if (!downLoadFile(task.files[m])) {
                         toastLog("下载" + task.files[m] + "失败");
                         success = false;
                         break;
                     }
                 }
                 refreshFileSystem();
                 if (success) {
                     break;
                 }
             }
             goBackToMain();
             DoingWeibo(task);

         }
         goBackToMain();

     }
     //exit();
     sleep(60000 * 5);
 }




 function DoingWeibo(task) {

     app.launchApp("微博");
     sleep(10000);
     if (text("跳过").exists()) {
         text("跳过").findOne().click();
         sleep(5000);
     }

     if (!desc("我").className("android.widget.FrameLayout").exists()) {
         console.log("未能进入到主界面");
         return;
     }
     desc("我").className("android.widget.FrameLayout").findOne().click();
     sleep(3000);

     if (!text(task.WeiboName).className("android.widget.TextView").exists()) {
         console.log("未能找到" + task.WeiboName + "控件");
         //切换账号
         if (!bounds(953.0, 88.0, 1022.0, 154.0).className("android.widget.ImageView").exists()) {
             console.log("未能找到设置按钮");
             return;
         }
         bounds(953.0, 88.0, 1022.0, 154.0).className("android.widget.ImageView").findOne().click();
         sleep(2000);
         desc("帐号管理").findOne().click();
         sleep(1000);
         if (!text(task.WeiboName).exists()) {
             console.log("未找到登录账号，请人工登录");
             toast("未找到登录账号，请人工登录" + task.WeiboName);
             return;
         }
         text(task.WeiboName).findOne().parent().click();
         sleep(5000);
         //重新执行
         DoingWeibo(task);
         return;
     }

     desc("首页").className("android.widget.FrameLayout").findOne().click();
     sleep(3000);
     //发博文
     console.log("开始发布博文");
     publish(task);
     toastLog("博文发布成功");
 }

 function publish(task) {
     if (!id("titleSave").exists()) {
         console.log("未找到发布按钮");
         return;
     }
     id("titleSave").findOne().parent().click();
     //再次刷新文件系统
     refreshFileSystem();
     sleep(3000);

     if (task.ContentType == 0) {
         //发纯文字
         text("写微博").id("tipview").findOne().parent().click();
         sleep(2000);
         publishText(task);
     } else if (task.ContentType == 1) {
         //发图片

         text("图片").id("tipview").findOne().parent().click();
         sleep(2000);
         publishImage(task);
     } else {

         //发视频
         text("视频").id("tipview").findOne().parent().click();
         sleep(2000);
         publishVedio(task);
     }
 }

 //刷新文件系统
 function refreshFileSystem() {
     var arr = files.listDir(ImageDir);
     if (arr.length > 0) {
         for (j = arr.length - 1; j >= 0; j--) {
             if (files.exists(ImageDir + arr[j])) {
                 media.scanFile(ImageDir + arr[j]);
                 app.sendBroadcast(
                     new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, android.net.Uri.fromFile(new java.io.File(ImageDir + arr[j])))
                 );
             }
         }
     }
     media.scanFile(ImageDir);
     app.sendBroadcast(
         new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, android.net.Uri.fromFile(new java.io.File(ImageDir)))
     );
     sleep(5000)
 }
 //删除所有视频和图片
 function deleteAllMedia() {
     var dirs = [
         "/sdcard/DCIM/Screenshots/",
         "/sdcard/DCIM/Camera/",
         "/sdcard/autoImage/",
         "/sdcard/Pictures/",
         "/sdcard/DCIM/ScreenRecorder/",
         "/sdcard/Pictures/weibo/",
         "/sdcard/sina/weibo/storage/photoalbum_save/weibo/",
         "/sdcard/DCIM/Camera/小红书/",
     ]
     for (var i = 0; i < dirs.length; i++) {
         var arr = files.listDir(dirs[i]);
         if (arr.length > 0) {
             for (j = arr.length - 1; j >= 0; j--) {
                 if (files.exists(dirs[i] + arr[j])) {
                     files.remove(dirs[i] + arr[j]);
                 }
             }

         }
     }
     refreshFileSystem();
 }

 function publishImage(task) {
     sleep(2000);
     try {
         //选择相册
         if (!id("photo_album_title_text").exists) {
             console.log("未找到相机胶卷标题栏");
             return;
         }
         id("photo_album_title_text").findOne().parent().click();
         sleep(2000);
         if (!id("photo_album_listview").exists() || id("photo_album_listview").findOne().childCount() < 2) {
             console.log("未能加载相册列表");
             return;
         }
         id("photo_album_listview").findOne().child(1).click();
         sleep(2000)
         var list = id("photo_album_gridview").findOne().children();
         if (list.length != task.files.length) {
             console.log("图片加载失败，请检查");
             toast("图片加载失败，请检查");
             return;
         }
         //选中图片
         for (var i = 0; i < task.files.length; i++) {
             list[i].children().forEach(function(child) {
                 if (child.className() == "android.view.View") {
                     child.click();
                     sleep(1000);
                 }
             });
         }
         sleep(2000);
         //点击下一步
         //点击下一步
         if (desc("下一步").exists()) {
             desc("下一步").findOne().click();
         } else if (text("下一步").exists()) {
             text("下一步").findOne().click();
         } else {
             click(950, 84);
         }
         sleep(2000);
         if (!id("btn_confirm_edit").exists()) {
             console.log("未进入到发布博文界面，发布失败！！！");
             return
         }
         id("btn_confirm_edit").findOne().click();
         sleep(2000);
         id("edit_view").setText(task.Content);
         sleep(1000);
         desc("发送").findOne().parent().click();
         sleep(3000);
         //提交结果
         task.Status = 2;
         task.WbPublishTimeStr = formatDate(new Date());
         uploadTaskResult(task);
     } catch (e) {
         task.Status = 3;
         task.WbPublishTimeStr = formatDate(new Date());
         uploadTaskResult(task);
     }

 }

 function publishVedio() {
     sleep(3000);
     try {
         //选择相册
         if (!id("photo_album_title_text").exists) {
             console.log("未找到相机胶卷标题栏");
             return;
         }
         id("photo_album_title_text").findOne().parent().click();
         sleep(2000);
         if (!id("photo_album_listview").exists() || id("photo_album_listview").findOne().childCount() < 2) {
             console.log("未能加载相册列表");
             return;
         }

         if (!id("photo_album_gridview").exists()) {
             console.log("未找到视频选择控件，失败！");
             return
         }
         var list = id("photo_album_gridview").findOne().children();
         if (list.length < (task.files.length + 1)) {
             console.log("视频加载失败，请检查");
             toast("视频加载失败，请检查");
             return;
         }
         //选中视频
         list[1].children().forEach(function(child) {
             if (child.className() == "android.view.View") {
                 child.click();
             }
         });
         sleep(5000);
         //点击下一步
         if (desc("下一步").exists()) {
             desc("下一步").findOne().click();
         } else if (text("下一步").exists()) {
             text("下一步").findOne().click();
         } else {
             click(950, 84);
         }
         sleep(2000);
         if (!id("edit_view").exists()) {
             console.log("未进入发送视频界面，执行失败！");

             return
         }
         id("edit_view").setText(task.Content);
         sleep(1000);
         desc("发送").findOne().parent().click();
         sleep(3000);

         //提交结果
         task.Status = 2;
         task.WbPublishTimeStr = formatDate(new Date());
         uploadTaskResult(task);
     } catch (e) {
         task.Status = 3;
         task.WbPublishTimeStr = formatDate(new Date());
         console.log("视频发布失败！", e)
         uploadTaskResult(task);
     }
 }

 function publishText() {
     try {
         id("edit_view").setText(task.Content);
         sleep(1000);
         desc("发送").findOne().parent().click();
         sleep(3000);
         //提交结果
         task.Status = 2;
         task.WbPublishTimeStr = formatDate(new Date());
         uploadTaskResult(task);
     } catch (e) {
         task.Status = 3;
         task.WbPublishTimeStr = formatDate(new Date());
         uploadTaskResult(task);
     }
 }

 function uploadTaskResult(task) {
     try {
         console.log("提交任务", "http://" + serverAddress + "/api/uploadBlogTask", task);
         var resp = http.postJson("http://" + serverAddress + "/api/uploadBlogTask", task);
         if (resp == null || resp.statusCode != 200 || resp.body == null) {
             return null;
         }
         var result = JSON.parse(resp.body.string());
         return result.Status == 0;
     } catch (e) {
         console.log(e)
         return false;
     }
 }

 function getTask(uid) {
     try {
         var resp = http.get("http://" + serverAddress + "/api/getBlogTask?uid=" + uid);

         if (resp == null || resp.statusCode != 200 || resp.body == null) {
             return null;
         }
         var result = JSON.parse(resp.body.string());
         //console.log(result)
         if (result != null && result.Data != null)
             for (var i = 0; i < result.Data.length; i++) {
                 result.Data[i].files = result.Data[i].FileNames.split(",");
             }

         return result.Data;
     } catch (e) {
         console.log(e)
         return null;
     }
 }

 function downLoadFile(file) {
     try {
         var r = http.get("http://" + serverAddress + "/api/downLoadFile?file=" + file);
         if (r == null || r.statusCode != 200 || r.body == null) {
             return false;
         }

         //写入指定文件
         console.log("写入指定文件:" + ImageDir + file);
         files.writeBytes(ImageDir + file, r.body.bytes());

         return true;
     } catch (e) {
         console.log(e);
         return false;
     }
 }


 function isMain() {
     return currentPackage() == "com.sina.weibo" && currentActivity() == "com.sina.weibo.MainTabActivity";
 }

 function goBackToMain() {
     toastLog("退回微博主页");
     var i = 0;
     while (++i < 10) {
         if (currentPackage() == "com.sina.weibo") {
             if (currentActivity() != "com.sina.weibo.MainTabActivity") {
                 back();
             } else {
                 break;
             }

         } else {
             app.launchApp("微博");
             sleep(10000);
         }
         sleep(1000);
         if (text("不保存").exists()) {
             text("不保存").findOne().click();
         }
         sleep(2000);
     }
 }

 function weiboTask() {
     this.Id = 0 //               int
     this.Uid = "" // string
     this.WeiboName //string
     this.FollowWeixinName //string
     this.Content //string
     this.ContentType //int
     this.FileNames ////string
     this.Status //int //0待发布，1发布中，2已发布，3发布失败，4已删除
     this.CreateTime //time.Time
     this.WxPublishTime //time.Time //微信发布时间
     this.WbPublishTime //time.Time //微博发布时间
     this.WbPublishTimeStr //time.Time //微博发布时间
     this.TaskTime //time.Time //任务领取时间
     this.files = []
 }

 function formatDate(time) {
     var date = time;
     var year = date.getFullYear(),
         month = date.getMonth() + 1, //月份是从0开始的
         day = date.getDate(),
         hour = date.getHours(),
         min = date.getMinutes(),
         sec = date.getSeconds();
     var newTime = year + '-' +
         (month < 10 ? '0' + month : month) + '-' +
         (day < 10 ? '0' + day : day) + ' ' +
         (hour < 10 ? '0' + hour : hour) + ':' +
         (min < 10 ? '0' + min : min) + ':' +
         (sec < 10 ? '0' + sec : sec);

     return newTime;
 }




 function init去限制() {
     importClass(com.stardust.autojs.core.accessibility.AccessibilityBridge.WindowFilter);
     let bridge = runtime.accessibilityBridge;
     let bridgeField = runtime.getClass().getDeclaredField("accessibilityBridge");
     let configField = bridgeField.getType().getDeclaredField("mConfig");
     configField.setAccessible(true);
     configField.set(bridge, configField.getType().newInstance());
     bridge.setWindowFilter(new JavaAdapter(AccessibilityBridge$WindowFilter, {
         filter: function(info) {
             return true;
         }
     }));
 }
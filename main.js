//设置服务器地址
var serverAddress = "192.168.1.10:8008";

//require("./jiechu.js");
//require("./moment.js");
auto.waitFor();
init去限制();




// console.log(getSNSContent());
// exit();
// console.log(getTime("09:55"), getTime("2022-01-01T00:00:00Z"))
// console.log(comparetime(getTime("09:55"), getTime("2022-01-01T00:00:00Z")))
// exit();

toast("开启执行");

while (true) {
    sleep(5000);
    var task = getTask();
    if (task != null) {
        toastLog.log("开始执行任务", task)
        Doing(task);
    }
}

function Doing(task) {
    //打开微信App 
    var appName = "微信";
    launchApp(appName);

    sleep(3000);

    //退回到微信首页
    gotoweixinmain();
    sleep(1000);

    click(890, 120)
    sleep(3000);

    text("搜索").setText(task.FollowWeixinName);
    sleep(3000)
    var exists = false;
    var item = text("搜索");
    if (text("联系人").exists() || text("最常使用").exists()) {
        for (var i = 0; i < className("android.widget.ListView").findOne().childCount(); i++) {
            var child = className("android.widget.ListView").findOne().children()[i];
            //console.log(child.className());
            if (child.className() == "android.widget.RelativeLayout") {

                if (child.child(0).className() == "android.widget.TextView" && child.child(0).text() == task.FollowWeixinName) {
                    exists = true;
                    item = child;
                    break;
                }
                //console.log(child.childCount())
                if (child.childCount() == 2) {
                    console.log(child.child(1))
                    if (child.child(1).className() == "android.widget.TextView" && child.child(1).text() == "微信号: " + task.FollowWeixinName) {
                        exists = true;
                        item = child;
                        break;
                    }
                }
            }
        }
        if (!exists) {
            var child = className("android.widget.ListView").findOne().children()[2];
            item = child;
            exists = true;
            child.child(0).click();
        }
    }

    if (!exists) {
        console.log("未能搜索到用户：" + task.FollowWeixinName)
        return;
    }
    //点击进入聊天界面
    sleep(1000)
    var rect = item.bounds();
    click(rect.centerX(), rect.centerY());
    sleep(3000)
    if (!desc("更多信息").className("android.widget.ImageView").exists()) {
        console.log("未找到右上角 更多信息按钮");
        return;
    }

    //点击右上角更多信息
    desc("更多信息").className("android.widget.ImageView").findOne().click()
    sleep(3000)

    className("android.widget.ListView").findOne().children()[0].children()[0].click();
    sleep(3000)

    //点击进入朋友圈
    if (!text("朋友圈").exists()) {
        console.log("未开放朋友圈");
        return;
    }
    text("朋友圈").findOne().parent().click();

    //循环往下拉15下以加载更多内容

    for (i = 0; i < 15; i++) {
        swipe(500, 1600, 500, 800, 1000)
        sleep(2000)
        if (text("朋友仅展示最近半年的朋友圈").exists() || text("朋友仅展示最近三天的朋友圈").exists()) {
            break;
        }
    }
    back();
    sleep(2000)
    text("朋友圈").findOne().parent().click();
    sleep(2000)

    //点击朋友圈第一条，进入循环获取图片界面
    if (!className("android.widget.ListView").exists()) {
        console.log("进入朋友圈页面失败");
        return;
    }
    if (className("android.widget.ListView").findOne().childCount() > 1) {
        var item = className("android.widget.ListView").findOne().children()[1];
        if (item.className() == "android.widget.LinearLayout" &&
            item.childCount() > 0 && item.child(0).className() == "android.widget.LinearLayout" &&
            item.child(0).childCount() > 0 && item.child(0).child(0).className() == "android.widget.LinearLayout") {
            item.child(0).child(0).click();
        }
    }

    //循环下载朋友圈内容
    ViewSNSContent(task);
    gotoweixinmain();
}



//获取朋友圈的文字内容
function getSNSContent() {
    var content = "";
    for (var i = 0; i < desc("更多信息").findOne().parent().childCount(); i++) {
        var item = desc("更多信息").findOne().parent().child(i);
        if (item.className() == "android.widget.TextView")
            if (item.id() == "android:id/text1" && item.id() == "android:id/text2") {
                continue
            } else {
                content = item.text();
                break;
            }

    }
    return content;
}

//循环下载朋友圈内容
function ViewSNSContent(task) {
    // console.log(currentActivity());
    // if (currentActivity() != "com.tencent.mm.plugin.sns.ui.SnsGalleryUI") {
    //     console.log("没有进入朋友圈界面，退出")
    //     exit();
    // }
    initWeixinFile(); //初始化微信相册
    var time = id("text1").findOne().text();
    var content = getSNSContent();
    var index = 0;
    while (true) {
        //如果朋友圈时间小于上次时间，则退出
        if (!comparetime(id("text1").findOnce().text(), task.LastContentTime)) {
            console.log("没有更新的朋友圈", getTime(id("text1").findOnce().text()), task.LastContentTime)
            break;
        }
        index++;
        //如果连续滑动100次则强制结束
        if (index > 100) {
            break;
        }
        //下载文件
        desc("更多信息").findOne().click();
        sleep(1000)
        var contentType = 0;
        if (text("保存图片").exists()) {
            contentType = 1
            text("保存图片").findOne().parent().click();
        } else {
            contentType = 2
            text("保存视频").findOne().parent().click();
        }
        sleep(1000)
        swipe(900, 700, 100, 700, 1000)
        sleep(3000)
        var tempContent = getSNSContent(); //获取朋友圈当前内容
        //这是一条新的朋友圈，上传旧内容
        if (time != id("text1").findOne().text() || content != tempContent) {
            //上传文件
            var fileNames = getWeixinFile();
            if (fileNames.length == 0) {
                //上传文件失败，跳出结束
                return
            }
            uploadTask(task, content, contentType, getTime(time), fileNames);
            time = id("text1").findOne().text();
            content = tempContent;
            continue;

        } else {
            //判断是否有文件重复
            if (checkfileexists()) {
                var fileNames = getWeixinFile();
                if (fileNames.length == 0) {
                    //上传文件失败，跳出结束
                    return
                }
                uploadTask(task, content, contentType, getTime(time), fileNames);
                break;
            }

        }
    }
}

//#region  微信文件操作
//清空微信图片
function initWeixinFile() {
    var path = "/storage/emulated/0/Pictures/WeiXin/";
    var arr = files.listDir(path);
    for (i = arr.length - 1; i >= 0; i--) {
        if (files.exists(path + arr[i]))
            files.remove(path + arr[i]);
    }
}
//批量删除微信文件夹的文件，返回文件名数组
function getWeixinFile() {
    var fileList = new Array();
    var path = "/storage/emulated/0/Pictures/WeiXin/";
    //console.log(files.exists("/storage/emulated/0/Pictures/WeiXin"))
    var arr = files.listDir(path);
    for (i = arr.length - 1; i >= 0; i--) {
        var ftemp = "";
        for (var j = 0; j < 3; j++) {
            var file = uploadFile(path + arr[i]); //上传文件,
            if (file != "") {
                ftemp = file[0];
                //文件列表中已经存在的则不加入
                if (fileList.indexOf(file[0]) = -1) {
                    fileList.push(file[0]);
                }
                break;
            }
        }
        if (ftemp == "") {
            //上传文件失败
            return fileList;
        }
    }

    //清空文件夹
    arr = files.listDir(path);
    for (i = arr.length - 1; i >= 0; i--) {
        if (files.exists(path + arr[i]))
            files.remove(path + arr[i]);

    }
    //console.log(fileList);
    return fileList;
}

//测试文件是否存在
function checkfileexists() {
    var path = "/storage/emulated/0/Pictures/WeiXin/";
    var fileList = new Array();
    var arr = files.listDir(path);
    for (i = arr.length - 1; i >= 0; i--) {
        var data = files.readBytes(path + arr[i]);
        var length = data.length;
        var exists = false;
        for (j = 0; j < fileList.length; j++) {
            if (fileList[j] == length) {
                exists = true;
                break
            }
        }
        if (exists) {
            console.log("重复:" + path + arr[i]);
            return true;
        } else {
            fileList.push(length);
        }
    }
    return false;
}
//#endregion


//回到微信首页
function gotoweixinmain() {
    var i = 0;
    toast("退回微信主页")
    while (++i < 10) {
        if (currentPackage() == "com.tencent.mm") {
            if (currentActivity() != "com.tencent.mm.ui.LauncherUI") {
                back();
            } else {
                break;
            }
        } else {
            var appName = "微信";
            //console.log("open weixin");
            launchApp(appName);
            sleep(3000);
        }

        //console.log(currentActivity(), currentActivity() != "com.tencent.mm.ui.LauncherUI")
        // if (currentActivity() != "com.tencent.mm.ui.LauncherUI") {
        //     if (currentActivity() == "com.miui.home.launcher.Launcher") {
        //         var appName = "微信";
        //         console.log("open weixin");
        //         launchApp(appName);
        //         sleep(3000);
        //     } else {
        //         back();
        //     }
        // } else {
        //     if (currentActivity() == "com.miui.home.launcher.Launcher") {
        //         var appName = "微信";
        //         console.log("open weixin");
        //         launchApp(appName);
        //         sleep(3000);
        //     }
        //     if (desc("搜索").className("android.widget.RelativeLayout").exists()) {
        //         break;
        //     } else {
        //         back();
        //     }
        // }
        sleep(1500);

    }
}




//提交任务
function uploadTask(task, content, contentType, time, files) {

    try {
        var data = {
            Uid: task.Uid,
            WeiboName: task.WeiboName,
            FollowWeixinName: task.FollowWeixinName,
            Content: content,
            ContentType: contentType,
            FileNames: files.join(","),
            WxPublishTimeStr: time,
            Status: 0, //0待发布，1发布中，2已发布，3发布失败，4已删除

        };
        //console.log("http://" + serverAddress + "/api/uploadBlogs");
        //console.log(JSON.stringify(data));
        var resp = http.postJson("http://" + serverAddress + "/api/uploadBlogs", data);
        if (resp == null || resp.body == null) {
            return false;
        }
        //console.log(resp.body.string())
        var objj = JSON.parse(resp.body.string());
        if (objj.State == 1) {
            toastLog("提交任务成功");
            return true;
        } else {
            toastLog("提交任务失败" + objj.Message);
            return false;
        }
    } catch (e) {
        toastLog("error!!!提交任务失败！", e);
        return false;
    }


}

function uploadFile(file) {
    try {
        //console.log(file)
        var resp = http.postMultipart("http://" + serverAddress + "/api/uploadFile", {
            file: open(file)
        })

        var result = JSON.parse(resp.body.string());
        if (result.State == 1) {
            toastLog("上传图片成功" + result.Data, file);
            return result.Data;
        } else {
            toastLog("上传图片失败" + result.Message), file;
            return "";
        }
    } catch (e) {
        toastLog("error!!!上传文件失败！", e);
        return "";
    }
    //return response.body.string();
}


function getTask() {
    try {

        var resp = http.get("http://" + serverAddress + "/api/getTask");

        if (resp == null || resp.body == null) {
            return null;
        }
        var objj = JSON.parse(resp.body.string());
        if (objj.State == 1) {
            return objj.Data;
        } else {
            toastLog("获取任务失败" + objj.Message);
            return null;
        }
    } catch (e) {
        toastLog("error!!!获取任务失败！", e);
        return null;
    }
}





//#region  时间处理模块

function getTime(timestr) {
    var old = timestr
    var tt = "";
    timestr = timestr.replace('T', ' ').replace('Z', ' ')
    var datetime = timestr.split(' ');
    if (datetime.length == 1) {
        //今天
        var t = new Date();
        tt = t.getFullYear() + "/" + (t.getMonth() + 1) + "/" + t.getDate() + " " + timestr + ":00";
    } else {
        if (datetime[0] == "昨天") {
            var t = new Date();
            var t_s = t.getTime();
            t.setTime(t_s - 1000 * 60 * 60 * 24);
            tt = t.getFullYear() + "/" + (t.getMonth() + 1) + "/" + t.getDate() + " " + datetime[1] + ":00";
        } else if (datetime[0].indexOf('年') > 0) {
            tt = datetime[0].replace("年", "/").replace("月", "/").replace("日", " ") + datetime[1] + ":00";
        } else {
            tt = datetime[0].replace(/-/g, '/') + " " + datetime[1].substr(0, 8)
        }
    }
    newt = formatDate(tt);
    //console.log(old, newt)
    return newt
}

function formatDate(time) {
    var date = new Date(time);
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

//比较时间
function comparetime(beginTime, endTime) {
    beginTime = getTime(beginTime);
    endTime = getTime(endTime);
    var d1 = new Date(beginTime.replace('-', '/').replace('-', '/'))
    var d2 = new Date(endTime.replace('-', '/').replace('-', '/'))
    return d1 > d2
}
//#endregion



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
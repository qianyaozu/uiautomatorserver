package main

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/qianyaozu/qcommon"
)

//微信接口

//获取单条克隆任务 20分钟一次
func getTask(c *gin.Context) {
	tasks, err := GetTasks()
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, err))
		return
	}
	if len(tasks) == 0 {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, nil))
		return
	} else {
		task := tasks[0]
		task.LastFollowTime = time.Now()
		UpdateTask(task)
		if err != nil {
			c.JSON(http.StatusOK, qcommon.ResponseJson(nil, err))
			return
		} else {
			c.JSON(http.StatusOK, qcommon.ResponseJson(task, nil))
			return
		}
	}
}

func uploadFile(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, err))
		return
	}
	//1.获取文件
	files := form.File["file"]
	fps := make([]string, 0)
	//2.循环全部的文件
	for _, file := range files {
		// 3.根据时间鹾生成文件名
		fileNameInt := time.Now().Unix()
		fileNameStr := strconv.FormatInt(fileNameInt, 10)
		//4.新的文件名(如果是同时上传多张图片的时候就会同名，因此这里使用时间鹾加文件名方式)
		fileName := fileNameStr + file.Filename
		//5.保存上传文件
		filePath := filepath.Join(Mkdir("upload"), "/", fileName)

		c.SaveUploadedFile(file, filePath)
		//计算文件md5值
		pFile, err := os.Open(filePath)
		if err != nil {
			c.JSON(http.StatusOK, qcommon.ResponseJson(nil, err))
			return
		}
		defer pFile.Close()
		md5h := md5.New()
		io.Copy(md5h, pFile)
		md5str := hex.EncodeToString(md5h.Sum(nil))
		//判断md5是否已经存在，存在则新增，不存在则删除
		fs, err := QueryFileMappingByMd5(md5str)
		if len(fs) > 0 {
			os.Remove(filePath)
			fps = append(fps, fs[0].FileName)
		} else {
			var fm FileMapping
			fm.FileName = fileName
			fm.Size = file.Size
			fm.FilePath = filePath
			fm.CreateTime = time.Now()
			fm.Md5 = md5str
			count, err := AddFileMapping(fm)
			if err != nil {
				c.JSON(http.StatusOK, qcommon.ResponseJson(nil, err))
				return
			}
			if count < 1 {
				c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("插入失败")))
				return
			}
			fps = append(fps, fm.FileName)
		}

	}
	c.JSON(http.StatusOK, qcommon.ResponseJson(fps, nil))

}

func uploadBlogs(c *gin.Context) {

	var content ContentModel
	err := c.Bind(&content)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("提交失败"+err.Error())))
		return
	}
	content.WxPublishTime, _ = time.ParseInLocation("2006-01-02 15:04:05", content.WxPublishTimeStr, time.Local)

	//判断这条朋友圈是否已经存在
	b, err := ExistsContentByUID(content.Uid, content.Content, content.WxPublishTime)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("新增失败")))
		return
	}
	if b {
		//已存在
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("该条内容已经存在，保存失败")))
	} else {
		content.CreateTime = time.Now()
		content.TaskTime = time.Now()
		content.ExcuteNumber = 0
		//新增朋友圈内容
		InsertContent(content)
		//更新主任务时间
		var t Task
		t.Uid = content.Uid
		t.LastContentTime = content.WxPublishTime
		UpdateTaskLastPublishTime(t)

		c.JSON(http.StatusOK, qcommon.ResponseJson("ok", nil))
	}

}

//微博获取发博文任务接口
func getBlogTask(c *gin.Context) {
	uid := c.Query("uid")
	if uid == "" {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("uid不得为空")))
		return
	}
	list, err := GetAllContentTask(uid)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("获取任务失败"+err.Error())))
		return
	}
	if len(list) > 0 {
		for i := 0; i < len(list); i++ {
			fmt.Println("UpdateDoingContentStatus", list[i].Id, list[i].ExcuteNumber+1)
			UpdateDoingContentStatus(list[i].Id, list[i].ExcuteNumber+1)
		}

	}

	c.JSON(http.StatusOK, qcommon.ResponseJson(list, nil))
}

//下载文件接口
func downLoadFile(c *gin.Context) {
	filename := c.Query("file")
	if filename == "" {
		//c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("file不得为空")))
		return
	}
	files, err := QueryFileMappingByFileName(filename)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("下载失败"+err.Error())))
		return
	}
	if len(files) == 0 {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("该文件不存在")))
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename="+files[0].FileName)
	c.Header("Content-Transfer-Encoding", "binary")
	fio, err := os.Open(files[0].FilePath)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("下载失败"+err.Error())))
		return
	}
	defer fio.Close()
	c.File(files[0].FilePath)
	return
	//c.JSON(http.StatusOK, qcommon.ResponseJson(nil, nil))

}

//提交发布博文接口
func uploadBlogTask(c *gin.Context) {
	var content ContentModel
	err := c.Bind(&content)
	if err != nil {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("提交失败")))
		return
	}
	content.WbPublishTime, _ = time.ParseInLocation("2006-01-02 15:04:05", content.WbPublishTimeStr, time.Local)
	b, err := UpdateContentStatus(content.Id, content.Status, content.WbPublishTime)
	if err != nil || !b {
		c.JSON(http.StatusOK, qcommon.ResponseJson(nil, errors.New("提交失败")))
		return
	}
	c.JSON(http.StatusOK, qcommon.ResponseJson("ok", nil))
}

func Mkdir(basePath string) string {
	//	1.获取当前时间,并且格式化时间
	folderName := time.Now().Format("2006/01")
	folderPath := filepath.Join(basePath, folderName)
	//使用mkdirall会创建多层级目录
	os.MkdirAll(folderPath, os.ModePerm)
	return folderPath
}

//循环重置 超过一小时已经执行但是没有提交的博文任务
func loopContentTaskStatus() {
	for {
		time.Sleep(30 * time.Second)

		list, err := GetAllOverTimeContentTask()

		//fmt.Println("循环获取重置任务：", len(list), err)
		if err != nil {
			fmt.Println(err)
			continue
		}
		for _, c := range list {
			UpdateReDoContentStatus(c.Id)
		}

		list, err = GetAllOverNumberContentTask()
		if err != nil {
			fmt.Println(err)
			continue
		}
		for _, c := range list {
			UpdateContentStatusById(c.Id, 3) //3发布失败
		}
	}
}

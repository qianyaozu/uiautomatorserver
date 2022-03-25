package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	//开启线程，定时重置任务及状态
	go loopContentTaskStatus()

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.Use(gin.Recovery())

	router.GET("/api/getTask", getTask)
	router.POST("/api/uploadFile", uploadFile)
	router.POST("api/uploadBlogs", uploadBlogs)

	router.GET("/api/getBlogTask", getBlogTask)
	router.GET("/api/downLoadFile", downLoadFile)
	router.POST("api/uploadBlogTask", uploadBlogTask)

	router.Run(":8008")
}

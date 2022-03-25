package main

import (
	"time"
)

type Task struct {
	Uid              string
	WeiboName        string
	FollowWeixinName string
	LastContentTime  time.Time
	LastFollowTime   time.Time
}

type ContentModel struct {
	Id               int
	Uid              string
	WeiboName        string
	FollowWeixinName string
	Content          string
	ContentType      int
	FileNames        string
	Status           int //0待发布，1发布中，2已发布，3发布失败，4已删除
	CreateTime       time.Time
	WxPublishTime    time.Time //微信发布时间
	WbPublishTime    time.Time //微博发布时间
	TaskTime         time.Time //任务领取时间
	ExcuteNumber     int       //执行次数

	WxPublishTimeStr string //json提交的string时间
	WbPublishTimeStr string
}

type FileMapping struct {
	Id         int
	FileName   string
	Size       int64
	FilePath   string
	CreateTime time.Time
	Md5        string
}

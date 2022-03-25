package main

import (
	"database/sql"
	"fmt"
	"time"
)

func init() {
	MakeTaskTable()
}

func GetTasks() (tasks []Task, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM Task where LastFollowTime<? limit 1", time.Now().Add(-20*time.Minute))
	tasks = make([]Task, 0)
	for rows.Next() {
		var t Task
		err = rows.Scan(
			&t.Uid,
			&t.WeiboName,
			&t.FollowWeixinName,
			&t.LastContentTime,
			&t.LastFollowTime)
		if err != nil {
			return
		}
		tasks = append(tasks, t)
	}

	rows.Close()

	return
}

func GetAllTask() ([]Task, error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return nil, err
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM Task ")
	var tasks = make([]Task, 0)

	for rows.Next() {
		var task Task
		err = rows.Scan(
			&task.Uid,
			&task.WeiboName,
			&task.FollowWeixinName,
			&task.LastContentTime,
			&task.LastFollowTime)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}

	rows.Close()

	return tasks, nil
}

func GetTaskById(uid string) (Task, error) {
	var t Task
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return t, err
	}
	defer db.Close()
	rows, err := db.Query("SELECT  * FROM Task where Uid=?", uid)
	var tasks = make([]Task, 0)
	for rows.Next() {
		var task Task
		err = rows.Scan(
			&task.Uid,
			&task.WeiboName,
			&task.FollowWeixinName,
			&task.LastContentTime,
			&task.LastFollowTime)
		if err != nil {
			return t, err
		}
		tasks = append(tasks, task)
	}

	rows.Close()
	if len(tasks) > 0 {
		return tasks[0], nil
	}
	return t, nil
}

//更新
func UpdateTask(task Task) bool {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()
	stmt, err := db.Prepare("update Task set WeiboName=?,FollowWeixinName=? ,LastContentTime=?,LastFollowTime=? where Uid=?")
	checkErr(err)

	res, err := stmt.Exec(task.WeiboName, task.FollowWeixinName, task.LastContentTime, task.LastFollowTime, task.Uid)
	checkErr(err)

	affect, err := res.RowsAffected()
	checkErr(err)

	return affect > 0
}

//更新上次发布时间
func UpdateTaskLastPublishTime(task Task) bool {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()
	stmt, err := db.Prepare("update Task set LastContentTime=? where Uid=? and LastContentTime<?")
	checkErr(err)

	res, err := stmt.Exec(task.LastContentTime, task.Uid, task.LastContentTime)
	checkErr(err)

	affect, err := res.RowsAffected()
	checkErr(err)

	return affect > 0
}

//新增
func InsertTask(task Task) int64 {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()
	stmt, err := db.Prepare("INSERT INTO Task(Uid,WeiboName, FollowWeixinName, LastContentTime,LastFollowTime" +
		") values(?,?,?,?,?,?)")
	checkErr(err)

	res, err := stmt.Exec(task.Uid, task.WeiboName, task.FollowWeixinName, task.LastContentTime, task.LastFollowTime)
	checkErr(err)

	id, err := res.LastInsertId()
	checkErr(err)

	return id
}

//删除
func DeleteTask(uid []string) bool {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()

	where := "(" + fmt.Sprint(uid[0])
	for i := 1; i < len(uid); i++ {
		where += "," + fmt.Sprint(uid[i])
	}
	where += ")"
	res, err := db.Exec("delete from Task where Uid  in " + where)
	checkErr(err)

	affect, err := res.RowsAffected()
	checkErr(err)
	return affect > 0
}

func checkErr(err error) {
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
}

func MakeTaskTable() {
	sql_table := `
    CREATE TABLE Task(
        Uid VARCHAR(64) PRIMARY KEY not NULL,
        WeiboName VARCHAR(64) NULL,
        FollowWeixinName VARCHAR(64) NULL,
        LastContentTime DATE null,
        LastFollowTime DATE null
        
    );
    `
	sql_table1 := `
    CREATE TABLE Content(
		Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Uid VARCHAR(64) not NULL,
        WeiboName VARCHAR(64) NULL,
        FollowWeixinName VARCHAR(64) NULL,
		Content VARCHAR(64) NULL,
        ContentType INTEGER null,
		FileNames VARCHAR(64) NULL,
        Status INTEGER NULL,
        CreateTime DATE null,
        WxPublishTime DATE null,
        WbPublishTime Date null,
		TaskTime Date null,
		ExcuteNumber INTEGER null
    );
    `
	sql_table2 := `
    CREATE TABLE FileMapping(
		Id INTEGER PRIMARY KEY AUTOINCREMENT,
        FileName VARCHAR(64) not NULL,
        Size INTEGER NULL,
        FilePath VARCHAR(2000) NULL,
		CreateTime Date NULL,
		Md5 varchar(64) null
    );
    `
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()
	db.Exec(sql_table)
	db.Exec(sql_table1)
	db.Exec(sql_table2)
}

func InsertContent(content ContentModel) int64 {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		checkErr(err)
	}
	defer db.Close()
	sql := "INSERT INTO Content(Uid,WeiboName, FollowWeixinName, Content,ContentType,FileNames,Status,CreateTime,WxPublishTime,WbPublishTime,TaskTime,ExcuteNumber" +
		") values(?,?,?,?,?,?,?,?,?,?,?,?)"
	//fmt.Println(sql)
	stmt, err := db.Prepare(sql)

	checkErr(err)

	res, err := stmt.Exec(content.Uid, content.WeiboName, content.FollowWeixinName, content.Content, content.ContentType, content.FileNames, content.Status, content.CreateTime, content.WxPublishTime, content.WbPublishTime, content.TaskTime, content.ExcuteNumber)
	checkErr(err)

	id, err := res.LastInsertId()
	checkErr(err)

	return id
}

//根据uid和内容信息判重
func ExistsContentByUID(uid string, content string, t time.Time) (b bool, err error) {

	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT  COUNT(*) FROM Content where Uid=? and Content=? and WxPublishTime=? ", uid, content, t)
	if err != nil {
		return
	}
	total := 0
	for rows.Next() {
		err := rows.Scan(
			&total,
		)
		if err != nil {
			fmt.Println("ExistsContentByUID error", err)
			continue
		}
	}
	rows.Close()

	return total > 0, err
}

//获取所有待执行任务
func GetAllContentTask(uid string) (list []ContentModel, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM Content where Uid=? and Status=0 limit 3 ", uid)
	if err != nil {
		return
	}
	list = make([]ContentModel, 0)
	for rows.Next() {
		var cont ContentModel
		err := rows.Scan(&cont.Id, &cont.Uid, &cont.WeiboName, &cont.FollowWeixinName, &cont.Content,
			&cont.ContentType, &cont.FileNames, &cont.Status, &cont.CreateTime, &cont.WxPublishTime,
			&cont.WbPublishTime, &cont.TaskTime, &cont.ExcuteNumber,
		)
		if err != nil {
			fmt.Println("GetAllContentTask error", err)
			continue
		}
		list = append(list, cont)
	}
	rows.Close()

	return
}

//获取所有执行超时的任务
func GetAllOverTimeContentTask() (list []ContentModel, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM Content where  Status=1 and TaskTime < ? ", time.Now().Add(-1*time.Hour))
	if err != nil {
		return
	}
	list = make([]ContentModel, 0)
	for rows.Next() {
		var cont ContentModel
		err := rows.Scan(&cont.Id, &cont.Uid, &cont.WeiboName, &cont.FollowWeixinName, &cont.Content,
			&cont.ContentType, &cont.FileNames, &cont.Status, &cont.CreateTime, &cont.WxPublishTime,
			&cont.WbPublishTime, &cont.TaskTime, &cont.ExcuteNumber,
		)
		if err != nil {
			fmt.Println("GetAllOverTimeContentTask error", err)
			continue
		}
		list = append(list, cont)
	}
	rows.Close()

	return
}

//获取所有执行超次数的任务
func GetAllOverNumberContentTask() (list []ContentModel, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM Content where  Status in (0,1) and ExcuteNumber > 5 ")
	if err != nil {
		return
	}
	list = make([]ContentModel, 0)
	for rows.Next() {
		var cont ContentModel
		err := rows.Scan(&cont.Id, &cont.Uid, &cont.WeiboName, &cont.FollowWeixinName, &cont.Content,
			&cont.ContentType, &cont.FileNames, &cont.Status, &cont.CreateTime, &cont.WxPublishTime,
			&cont.WbPublishTime, &cont.TaskTime, &cont.ExcuteNumber,
		)
		if err != nil {
			fmt.Println("GetAllOverNumberContentTask error", err)
			continue
		}
		list = append(list, cont)
	}
	rows.Close()

	return
}

//更新已执行的任务状态和时间
func UpdateDoingContentStatus(id int, number int) (b bool, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	result, err := db.Exec("update Content set Status=1,TaskTime=datetime('now','localtime'),ExcuteNumber=? where id = ?", number, id)
	if err != nil {
		return
	}
	c, err := result.RowsAffected()
	if err != nil {
		return
	}
	return c > 0, err
}

//更新重做的任务和状态
func UpdateReDoContentStatus(id int) (b bool, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	result, err := db.Exec("update Content set Status=0 where id = ?", id)
	if err != nil {
		return
	}
	c, err := result.RowsAffected()
	if err != nil {
		return
	}
	return c > 0, err
}

//更新重做的任务和状态
func UpdateContentStatusById(id int, status int) (b bool, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	result, err := db.Exec("update Content set Status=? where id = ?", status, id)
	if err != nil {
		return
	}
	c, err := result.RowsAffected()
	if err != nil {
		return
	}
	return c > 0, err
}

//更新已完成的任务状态和时间
func UpdateContentStatus(id int, status int, wbPublishTime time.Time) (b bool, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	result, err := db.Exec("update Content set Status=?,WbPublishTime=? where id = ?", status, wbPublishTime, id)
	if err != nil {
		return
	}
	c, err := result.RowsAffected()
	if err != nil {
		return
	}
	return c > 0, err
}

//新增附件数据库
func AddFileMapping(fm FileMapping) (id int64, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	stmt, err := db.Prepare("INSERT INTO FileMapping(FileName,Size, FilePath, CreateTime,Md5" +
		") values(?,?,?,?,?)")
	checkErr(err)

	res, err := stmt.Exec(fm.FileName, fm.Size, fm.FilePath, time.Now(), fm.Md5)
	checkErr(err)

	id, err = res.LastInsertId()
	checkErr(err)

	return
}

//根据文件名查询文件
func QueryFileMappingByFileName(file string) (fs []FileMapping, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM FileMapping where FileName=?  limit 1", file)
	if err != nil {
		return
	}
	fs = make([]FileMapping, 0)
	for rows.Next() {
		var f FileMapping
		err = rows.Scan(&f.Id, &f.FileName, &f.Size, &f.FilePath, &f.CreateTime, &f.Md5)
		if err != nil {
			fmt.Println(err)
			return
		}
		fs = append(fs, f)
	}
	rows.Close()

	return
}

//根据文件名查询文件
func QueryFileMappingByMd5(md5 string) (fs []FileMapping, err error) {
	db, err := sql.Open("sqlite3", "./uiautomator.db")
	if err != nil {
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT * FROM FileMapping where Md5=?  limit 1", md5)
	if err != nil {
		return
	}
	fs = make([]FileMapping, 0)
	for rows.Next() {
		var f FileMapping
		err = rows.Scan(&f.Id, &f.FileName, &f.Size, &f.FilePath, &f.CreateTime, &f.Md5)
		if err != nil {
			fmt.Println(err)
			return
		}
		fs = append(fs, f)
	}
	rows.Close()

	return
}

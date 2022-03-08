// JavaScript Document
var StudyURL = "/study/ajax.php";
var countTimeDelay = 180 * 1000;// 默认计时间隔 1分钟
var PopWinTime = 1200; //弹出确认框时间 单位秒
//var PopWinTime = 30; //弹出确认框时间 单位秒
var effectComTime = 300;//单位秒--弹出框确定时间间隔限制
var isCloseFlag = false;
var isSleep = true;//是否在睡梦中
var sleepTime = 0;//停止时间
var timeOutObj = null;//超时计时器
var countCourseTime = null;//播放计时器
var isPassTime = false;//是否超时了
function caclogid() {
}

//创建记时日志
function createlogid() {
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'insert', courseId: courseid },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {
			if (data.err != 0) {
				if (data.err == 2) {
					//window.location.href='/study/login.php'
				}
				window.close();
				return false;
			} else {
				logId = data.logId;
			}
		},
		error: function (data) {
			alert('播放失败，请重试');
			window.close();
			return false;
		}
	});
}


//开始播放课程 按指定的时间 来更新课程
function startPlayCourse() {
	//清楚已经学习完成标记
	del_study_cookie('studyW', 0);
	del_study_cookie('studyE', 0);
	del_study_cookie('studyS', 0);
	del_study_cookie('confirmC', 0);
	countCourseTime = setInterval("countCourseTimeFunction()", countTimeDelay);
}


//记录下课程播放时间
function countCourseTimeFunction() {
	isPassTime = false;
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'update', courseId: courseid, logId: logId },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {
			if (data.err < 0) {
				alert(data.msg);
				window.close();
				return false;
			} else if (data.err == '2') {
				alert('您的账号已在其他地方登录,被迫下线')
				window.close();
				return false;
			} else if (data.err == '1') {//学习完成
				if (data.examType == 'W') {
					var studyW = get_study_cookie('studyW'); // 获取cookie 是否已经弹出过提示框
					if (studyW != 1) { // 没有cookie 说明是第一次 弹出提示框
						set_study_cookie('studyW', 1, 10);
						ret = window.confirm('您的学习时间已达到要求，获得学分:' + data.credithour + '是否继续学习');
						if (!ret) {
							window.close();
							return false;
						}
					}
				} else if (data.examType == 'E') {
					var studyE = get_study_cookie('studyE'); // 获取cookie 是否已经弹出过提示框
					if (studyE != 1) { // 没有cookie 说明是第一次 弹出提示框
						ret = window.confirm('请根据您对本课程内容的理解，完成考核题！');
						if (ret) {
							window.opener.location.href = '/study/exam.php?courseid=' + data.courseId;
							window.close();
							return false;
						} else {
							set_study_cookie('studyE', 1, 10);
						}
					}
				} else if (data.examType == 'S') {
					var studyS = get_study_cookie('studyS'); // 获取cookie 是否已经弹出过提示框
					if (studyS != 1) { // 没有cookie 说明是第一次 弹出提示框
						ret = window.confirm('您的学习时间已达到要求，可以提交心得。现在提交心得吗？');
						if (ret) {
							window.opener.location.href = '/study/exam_summary.php?act=add&courseid=' + data.courseId;
							window.close();
							return false;
						} else {
							set_study_cookie('studyS', 1, 10);
						}
					}
				}
			} else if (data.err == '0') {//未完成
				var playTime = 0;
				playTime = data.playTime;
				if (playTime > 0 && playTime != null) {
					var needPopWin = isPopWin(playTime);
					if (needPopWin && 1 === 2) {
						updateLastStudyTime(); //记录下当前服务器时间
						var t = parseInt(effectComTime / 60);
						//ret = window.confirm("您是否要继续学习? \r\n 请在"+t+"分钟之内点击确定");
						//alert(countCourseTime)
						window.clearInterval(countCourseTime);//停止计时器
						sleepTime = 0;//计数器
						isSleep = true;
						clw().removediv();
						var contents = '<div style="color:#ff0000; text-align: center; height: 100px; margin-top: 20px; font-size: 14px; line-height: 20px;">您是否要继续学习? <br /> 请在' + t + '分钟之内点击确定<p><input type="button" style=" border:1px solid #ccc; margin-top:5px; padding:4px; cursor: pointer;" name="继续学习" value="继续学习" onclick="startLearning();"></p></div><iframe style="width:100%;height:1px;filter:alpha(opacity=0);-moz-opacity:0"></iframe>';
						clw().showDialog(300, 200, true).setTitle("温馨提示", false).setContent(contents);
						uTimeOut();
						return false;
					}
				}
			}

		},
		error: function (data) {
			//alert('计时失败');
			//window.close();
			//return false;
		}

	});
}


function startLearning() {
	clw().removediv();
	isSleep = false;
}

//超时计时器
function uTimeOut() {
	if (isSleep) {
		sleepTime++;
		if (sleepTime < (effectComTime + 60)) {//alert(effectComTime+"==>"+sleepTime)
			timeOutObj = setTimeout(uTimeOut, 1000);//每秒检测一次

		} else {
			if (timeOutObj) {
				clearTimeout(timeOutObj);
			}
			isStartPlayAgain();
		}

	} else {
		if (timeOutObj) {
			clearTimeout(timeOutObj);
		}
		isStartPlayAgain();

	}

}


function closePage(id, time, type) {
	sleepTime++;
	//alert(time)
	//alert(document.getElementById(id).innerHTML)
	if (sleepTime < time) {//alert(sleepTime)
		document.getElementById(id).innerHTML = time - sleepTime;
		timeOutObj = setTimeout(function () { closePage(id, time, type); }, 1000);//每秒检测一次


	} else {
		if (timeOutObj) {
			clearTimeout(timeOutObj);
		}
		if (type === 'close') {
			window.close();//关闭窗口
		} else if (type == 'checkSelectCourse') {
			checkSelectCourse();
		}
		clw().removediv();

	}
}

//是否可以重新开始播放
function isStartPlayAgain() {
	confirmTime = 0;
	sleepTime = 0;
	isPassTime = false;
	if (timeOutObj) {
		clearTimeout(timeOutObj);
	}
	confirmStopTime();
	if (parseInt(confirmTime) > effectComTime) {//2分钟不响应，则判断超时
		isPassTime = true;
		clw().removediv();
		var contents = '<div style="color:#ff0000; text-align: center; height: 100px; margin-top: 20px; font-size: 14px; line-height: 20px;">您超时了<p>系统将在<span id="closeTimeS">10</span>秒后自动关闭</p></div><iframe style="width:100%;height:1px;filter:alpha(opacity=0);-moz-opacity:0"></iframe>';
		clw().showDialog(300, 200).setTitle("超时提示", false).setContent(contents);
		closePage('closeTimeS', 10, 'close');
		//window.close();//关闭窗口
		return false;
	}

	countCourseTime = setInterval("countCourseTimeFunction()", countTimeDelay);//恢复计时器
}


//关闭播放窗口，并记录学习时间
function unloadCourseFrame() {
	if (isCloseFlag) {
		return
	}
	isCloseFlag = true;
	sleepTime = 0;
	clw().removediv();
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'exit', courseId: courseid, logId: logId },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {
			if (timeOutObj) {
				clearTimeout(timeOutObj);
			}
			var currentTime = (data.playTime == null) ? 0 : data.playTime;
			var totalPlayTime = secToTime(currentTime);
			if (isPassTime) {
				//var contents = '<div style="color:#F00; text-align:center;height:100px;margin-top:20px;">您已学习:'+totalPlayTime+'.<p><span onclick="clw().removediv();">确定</span></p><p>系统将在<span id="showTimeS">10</span>秒后自动关闭此对话框</p></div><iframe style="width:100%;height:1px;filter:alpha(opacity=0);-moz-opacity:0"></iframe>';
				//clw().showDialog(300,200).setTitle("选课提示",false).setContent(contents);
				//closePage('showTimeS',10,'');
			}
			$.ajax({
				type: "post",
				url: StudyURL,
				data: { act: 'getSession', courseId: courseid },
				async: false,
				cache: false,
				dataType: 'json',
				success: function (data, textStatus) {
					clw().removediv();
					if (data.isNotChooseCourse == 1) {
						sleepTime = 0;
						if (isPassTime) {
							//var contents = '<div style="color:#F00; text-align:center;height:100px;margin-top:20px;">您还没有选择这个课程，是否选课?<p><span onclick="if(timeOutObj){clearTimeout(timeOutObj);}clw().removediv();">选择</span>&nbsp;&nbsp;<span onclick="checkSelectCourse();">不选择</span></p><p>若无响应系统将在<span id="selectsTimeS">30</span>秒后自动为你选上此门课程</p></div><iframe style="width:100%;height:1px;filter:alpha(opacity=0);-moz-opacity:0"></iframe>';
							//clw().showDialog(300,200).setTitle("选课提示",false).setContent(contents);
							//closePage('selectsTimeS',30,'');
						} else {
							ret = window.confirm('您还没有选择这个课程，是否选课');
							if (!ret) {
								checkSelectCourse();
							}

						}
					}
				},
				error: function (data) {

				}
			});

			if (!isPassTime) {
				alert("您已学习:" + totalPlayTime + "。");
			}

		},
		error: function (data) {

		}
	});

	//return false;

}

function checkSelectCourse() {
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'removeChooseCourse', courseId: courseid },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {

		},
		error: function (data) {

		}
	});
}


//是否弹出确认学习框
function isPopWin(playTime) {
	var needPopWin = false;
	var t = playTime / PopWinTime;
	if (t >= 1) {
		var dalayT = countTimeDelay / 1000;
		var m = playTime % PopWinTime;
		if (m >= 0 && m < dalayT) {
			needPopWin = true;
		}
	}
	return needPopWin;
}

//填出框前更新服务器时间
function updateLastStudyTime() {
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'updateLastStudyTime' },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {

		},
		error: function (data) {

		}
	});

}

//取回间隔时间
function confirmStopTime() {
	$.ajax({
		type: "post",
		url: StudyURL,
		data: { act: 'confirmStopTime' },
		async: false,
		cache: false,
		dataType: 'json',
		success: function (data, textStatus) {
			confirmTime = data.time
		},
		error: function (data) {

		}
	});

}

/*播放课程*/
function playCourse(courseid, coursetitle, delay) {
	var date = new Date();
	var week = date.getDay();
	var hours = date.getHours();

	if (week >= 1 && week <= 5 && hours >= 9 && hours <= 16) {
		//ret=window.confirm('目前处于访问高峰，学习课程可能会出现课程无法打开的问题，请您尽量错峰学习。');
		//if(ret) {
		window.open("/study/container.htm?courseid=" + courseid + "&coursetitle=" + coursetitle + "&delay=" + delay, "k", "location=0,resizable=1");
		//}
	} else {
		window.open("/study/container.htm?courseid=" + courseid + "&coursetitle=" + coursetitle + "&delay=" + delay, "k", "location=0,resizable=1");
	}
}


//将秒专程时间
function secToTime(sec) {
	var hour;
	var min;
	var sec;

	var leftSec;

	if (isNaN(sec) == true) {
		alert("请选择一个对象！");
		return null;
	}

	hour = Math.floor(sec / 3600);
	hour = "00" + hour;
	hour = hour.substring(hour.length - 2, hour.length);

	leftSec = sec % 3600;

	min = Math.floor(leftSec / 60);
	min = "00" + min;
	min = min.substring(min.length - 2, min.length);

	sec = leftSec % 60;
	sec = "00" + sec;
	sec = sec.substring(sec.length - 2, sec.length);

	return hour + ":" + min + ":" + sec;
}


// 设置学习标记cookie 学到有效时间时 提示是否继续学习 【1】=》继续学习，下次不出现提示框，【2】=》否 一直弹出询问框
function set_study_cookie(name, value, expire) {
	var exp = new Date();
	exp.setTime(exp.getTime() + expire * 3600 * 1000);
	document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
	// document.cookie     = name + "="+ escape (value); 
}
//取cookie 值  
function get_study_cookie(name) {
	var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
	if (arr != null) return unescape(arr[2]); return null;
}

//删除cookie
function del_study_cookie(name, value) {
	var exp = new Date();
	exp.setTime(exp.getTime() - 1000);
	document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
	//var cval=getCookie(name);    
	//if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();    
} 
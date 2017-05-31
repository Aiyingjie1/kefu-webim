easemobim.genDomFromMsg = (function (window, _const, utils, profile) {
	var LOADING = Modernizr.inlinesvg ? _const.loadingSvg : '<img src="//kefu.easemob.com/webim/static/img/loading.gif" width="20" style="margin-top:10px;"/>';
	var parseLink = WebIM.utils.parseLink;
	var parseEmoji = WebIM.utils.parseEmoji;
	// 用来储存图片信息的file对象
	window.imgFileList = new easemobim.Dict();

	function _encode(str) {
		if (!str || str.length === 0) {
			return '';
		}
		var s = '';
		s = str.replace(/&amp;/g, "&");
		// 避免影响表情解析
		s = s.replace(/<(?=[^o][^)])/g, "&lt;");
		s = s.replace(/>/g, "&gt;");
		//s = s.replace(/\'/g, "&#39;");
		s = s.replace(/\"/g, "&quot;");
		return s;
	}

	function _decode(str) {
		if (typeof str !== 'string') {
			return '';
		}
		else {
			return str
				.replace(/&amp;/g, "&")
				.replace(/&#39;/g, "'")
				.replace(/&lt;/g, "<");
		}
	}

	function genMsgContent(msg) {
		var type = msg.type;
		var value = msg.data;
		var html = '';
		switch (type) {
		case 'txt':
			// 历史消息表情未经过im sdk 解析
			if (typeof value === 'string'){
				// fake:  todo: remove this
				value = _encode(_decode(value));
				html = '<pre>' + parseLink(parseEmoji(value)) + '</pre>';
			}
			// 实时消息表情经过im sdk 解析
			else if (_.isArray(value)){
				html = '<pre>' + _.map(value, function(item){
					var type = item.type;
					var data = item.data;
					var result;

					if (type === 'txt'){
						result = parseLink(data);
					}
					else if (type === 'emoji'){
						result = '<img class="emoji" src="' + data + '">';
					}
					else {}

					return result;
				}).join('') + '</pre>';
			}
			else {
				console.error('unexpected value type.');
			}
			break;
		case 'img':
			if(msg.data){
				// todo: move this to sendImg
				// 如果是自己发出去的图片则缓存File对象，用于全屏显示图片
				imgFileList.set(msg.url, msg.data);
			}
			// todo: remove a
			html = '<a href="javascript:;"><img class="em-widget-imgview" src="'
				+ msg.url + '"/></a>';
			break;
		case 'list':
			html = "<p>" + parseLink(_encode(value)) + "</p>" + msg.list;
			break;
		case 'file':
			// 历史会话中 filesize = 0
			// 访客端发文件消息 filesize = undefined
			// 需要过滤这两种情况，暂时只显示坐席发过来的文件大小
			html = '<i class="icon-attachment container-icon-attachment"></i>'
				+ '<span class="file-info">'
				+ '<p class="filename">' + msg.filename + '</p>'
				+ '<p class="filesize">' + easemobim.utils.filesizeFormat(msg.flie_length) + '</p>'
				+ '</span>'
				+ "<a target='_blank' href='" + msg.url + "' class='icon-download container-icon-download' title='"
				+ msg.filename + "'></a>";
			break;
		default:
			break;
		}

		return html;
	}

	function genDomFromMsg(msg, isReceived, isHistory) {
		var id = msg.id;
		var type = msg.type;
		var html = '';
		var dom = document.createElement('div');
		var direction = isReceived ? 'left' : 'right';
		var avatar = utils.getDataByPath(msg, 'ext.weichat.official_account.img') || profile.defaultAvatar;

		// 设置消息气泡显示在左侧还是右侧
		// .em-widget-right, .em-widget-left used here
		dom.className = 'em-widget-' + direction;

		// 给消息追加id，用于失败重发消息或撤回消息
		if (id) {
			dom.id = id;
		}

		// 坐席消息头像
		if (direction === 'left'){
			html += '<img class="avatar" src="' + avatar + '">';
		}

		// wrapper开始
		html += '<div class="em-widget-msg-wrapper">';

		// 设置消息气泡的突起位置
		// .icon-corner-right, .icon-corner-left used here
		html += '<i class="icon-corner-' + direction + '"></i>';

		// 发出的消息增加状态显示
		if (!isReceived && !isHistory && id) {
			html += '<div id="' + id
				+ '_failed" data-type="txt" class="em-widget-msg-status hide">'
				+ '<span>发送失败</span><i class="icon-circle"><i class="icon-exclamation"></i></i></div>'
				+ '<div id="' + id
				+ '_loading" class="em-widget-msg-loading">' + LOADING + '</div>';
		}


		// todo: simplify the class name em-widget-msg
		// container 开始
		// .em-widget-msg-* used here
		html += '<div class="em-widget-msg-container em-widget-msg-' + type + '">';
		// 消息内容
		html += genMsgContent(msg);

		// container 结束
		html += '</div>';

		// wrapper结尾
		html += '</div>';

		dom.innerHTML = html;
		return dom;
	}

	return genDomFromMsg;
}(window, easemobim._const, easemobim.utils, app.profile));

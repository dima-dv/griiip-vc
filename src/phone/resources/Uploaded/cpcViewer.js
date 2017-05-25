//////////////////////////////////////////////////////////////////////////
//
// cpcViewer
//
//------------------------------------------------------------------------
var cpcViewer = function(spec)
{
  var that = {};

  var m_aBytesFromUTF8 = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];
  var m_aOffsetFromUTF8 = [0, 0, 12416, 925824, 63447168, 4194836608, 2181570688];
  var m_aBaseLine = ["alphabetic", "top", "hanging", "middle", "ideographic", "bottom"];
  var m_aLineCap = ["butt", "round", "square"];
  var m_aLineJoin = ["bevel", "round", "miter"];
  var m_aTextAlign = ["start", "end", "center", "left", "right"];
  var m_aComposition = ["source-over", "source-atop", "source-in", "source-out", "destination-over", "destination-atop", "destination-in", "destination-out", "lighter", "copy", "xor"];
  var aFontStyle = ["normal", "italic", "oblique"];
  var aFontWeight = ["normal", "bold", "bolder", "lighter", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
  var aFontStretch = ["normal", "condensed", "ultra-condensed", "extra-condensed", "semi-condensed", "expanded", "semi-expanded", "extra-expanded", "ultra-expanded"];

  var m_aread = [function() { return read(); }, function() { return readInt16(); }, function() { return readInt24(); }, function() { return readInt32(); } ];

  var m_data = null; // cpc data
  var m_offs = 0;  // Current position in data
  var m_normX = 0;
  var m_normY = 0;
  var m_images = null;

  // Scaling and translating
  var m_scaleX = 1;
  var m_scaleY = 1;
  var m_offsX = 0;
  var m_offsY = 0;

  // Pages
  var m_numPages = 0;
  var m_offsPages = 0;
  var m_offsPageDir = 0;
  var m_sizePageAddr = 0;
  var m_readPageAddr = null;

  // Subrotines
  var m_numSubr = 0;
  var m_offsSubr = 0;
  var m_offsSubrDir = 0;
  var m_sizeSubrAddr = 0;
  var m_readSubrAddr = null;

  // Strings
  var m_numSid = 0;
  var m_offsSid = 0;
  var m_asid = null;

  // Fonts
  var m_numFonts = 0;
  var m_offsFonts = 0;

  // Images
  var m_numImages = 0;
  var m_offsImages = 0;
  var m_offsImageDir = 0;
  var m_sizeImageAddr = 0;

  // Bookmarks
  var m_offsBkmk = 0;

  // Currently painted page
  var m_canvas = null;
  var m_pageNo = null;
  var m_firstPageNo = 1;//store absolute first page number of chunk for links per page
  var m_ctx = null;
  var m_gradients = null;

  //
  // Private functions
  //

  // Get string from string identifier
  function getSid(sid)
  {
    return m_asid[sid - 1];
  }

  // loaded image callbak: this == the image
  function loadedImage()
  {
    //console.log("Load image " + this.width + " " + this.height);

    this.loadMode = 2;

    if (this.repaint)
    {
      for (var i = 0; i < this.repaint.length; ++i)
      {
        var r = this.repaint[i];

        that.printPage(r.canvas, r.page, r.canvas.cpcOptions);
      }

      this.repaint = null;
    }

    this.removeEventListener('load', loadedImage);
  }

  // create image
  function addImage(src)
  {
    var img = new Image();

    img.loadMode = 0; // 0 = not loading, 1 = loading, 2 = loaded
    img.repaint = null;
    img.addEventListener('load', loadedImage);

    m_images.push(img);

    //img.src = src;
    //console.log("start loading img: " + src);
    img.x_src = src;
  }

  // Extract bookmarks from bookmark data
  function loadBookmarks()
  {
    var x = read();

    if (!x) return null;

    var list = [];

    do
    {
      var r = {};

      r.title = readString();
      r.bold = read() != 0;
      r.italic = read() != 0;
      r.color = readString();
      if (r.color.length <= 0) r.color = null;
      r.isopen = (read() != 0);

      if (x == 1)
      {
        // External link
        r.url = readString();
      }
      else
      {
        // Internal link
        r.page = readUInt();
        r.offs = readUInt();
      }

      r.children = loadBookmarks();

      list.push(r);

      // Header of next in list - or end marker
      x = read();

    } while (x != 0);

    return list;
  }


  function moveTo(a_offs)
  {
    m_offs = a_offs;
  }


  function read()
  {
    return m_data[m_offs++];
  }


  function readInt16()
  {
    var v = read() * 256;

    return v + read();
  }


  function readInt24()
  {
    var v = readInt16() * 256;

    return v + read();
  }


  function readInt32()
  {
    var v = readInt16() * 65536;

    return v + readInt16();
  }


  function readUInt()
  {
    var c = read();

    if (c < 192) return c;

    var numByte = m_aBytesFromUTF8[c - 192];

    switch (numByte)
    {
      case 6: c = c * 64 + read();
      case 5: c = c * 64 + read();
      case 4: c = c * 64 + read();
      case 3: c = c * 64 + read();
      case 2: c = c * 64 + read();
    }

    return c - m_aOffsetFromUTF8[numByte];
  }


  function readChar()
  {
    return String.fromCharCode(readUInt());
  }


  function readString()
  {
    var s = "";

    var num = readUInt();

    while (num--) s += readChar();

    return s;
  }


  function readNumber()
  {
    var msb = read();
    var fNeg = (msb >= 128);
    var r;

    // Negative number?
    if (fNeg)
    {
      if (msb == 255)
      {
        // 31-bit number
        msb = read();
        fNeg = (msb >= 128);

        if (fNeg) msb -= 128;

        r = msb * 16777216;
        r += read() * 65536;
        r += read() * 256;
        r += read();

        if (fNeg) r = -r;

        return r / 100;
      }

      msb -= 128;
    }

    // Three byte number?
    if (msb >= 64)
    {
      r = (msb - 64) * 65536;
      r += read() * 256;
      r += read();
    }
    else
    {
      r = msb * 256;
      r += read();
    }

    if (fNeg) r = -r;

    return r / 100;
  }


  function readCoordX()
  {
    return readNumber() + m_normX;
  }


  function readCoordY()
  {
    return readNumber() + m_normY;
  }

  function readBytesToString(size)
  {
    var s = "";

    for (var end = m_offs + size; m_offs < end; )
    {
      s += String.fromCharCode(m_data[m_offs++]);
    }

    return s;
  }

/*
  function mouseMove(event, a_canvas)
  {
    a_canvas.style.cursor = (pickHotspot(event, a_canvas) ? 'pointer' : 'default');
  }


  function mouseClick(event, a_canvas)
  {
    var hs = pickHotspot(event, a_canvas);

    if (!hs) return;

    if (hs.url)
    {
      if (that.gotoURL) that.gotoURL(hs.url);
    }
    else if (hs.page)
    {
      if (that.gotoPage) that.gotoPage(hs.page, hs.offs);
    }
  }


  function pickHotspot(event, a_canvas)
  {
    var hotspots = a_canvas.cpcHotspots;

    if (!hotspots) return null;

    var bbox = a_canvas.getBoundingClientRect();
    var x = Math.round(event.clientX - bbox.left);
    var y = Math.round(event.clientY - bbox.top);

    for (var i = 0, len = hotspots.length; i < len; ++i)
    {
      var hs = hotspots[i];

      if (hs.x1 <= x && x <= hs.x2 && hs.y1 <= y && y <= hs.y2) return hs;
    }

    return null;
  }
*/

  function getImage(imgId)
  {
    if (0 <= imgId && imgId < m_images.length)
    {
      var img = m_images[imgId];

      switch (img.loadMode)
      {
        case 2: // loaded
          return img;

        case 0: // loading not started
          img.src = img.x_src;
          img.loadMode = 1;
          break;
      }

      // Image has not yet been downloaded. Register it for display once ready
      if (!img.repaint) img.repaint = [];

      var x = _.find(img.repaint, function(x) { return x.canvas === m_canvas && x.page === m_pageNo; });

      if (!x) img.repaint.push({ canvas: m_canvas, page: m_pageNo });
    }
    else
    {
      console.log("Unknown image: id" + imgId);
    }

    return null;
  }

  function getGradient(id)
  {
    if (!m_gradients || !m_gradients[id]) throw "Using undefined gradient: " + id;

    return m_gradients[id];
  }

  function fixFont(font)
  {
      if (font.indexOf("TimesNewRoman") == -1)
        return font; // good case. nothing to fix

	  var patterns= [
						{bad:"-Bold", good:"bold "}, {bad:"Bold", good:"bold "},
						{bad:"-Italic", good:"italic "}, {bad:"Italic", good:"italic "}
					];
	  var fontPatterns = [
			{bad:"TimesNewRomanPSMT", good:"Times New Roman"}, 
			{bad:"TimesNewRomanPS", good:"Times New Roman"},
			{bad:"TimesNewRoman", good:"Times New Roman"}
	  ];

	  var origFont = font;
	  for (var i = 0; i < patterns.length; i++)
	  {
		  if (font.indexOf(patterns[i].bad) != -1)
		  {
			  font = font.replace(patterns[i].bad, "");
			  font = patterns[i].good + font;
		  }
	  }
	  
	  for (var i = 0; i < fontPatterns.length; i++)
	  {
		  if (font.indexOf(fontPatterns[i].bad) != -1)
		  {
			  font = font.replace(fontPatterns[i].bad, fontPatterns[i].good);
		  }
	  }
	  
	  if (origFont != font)
	  {
		  console.log("original font: " + origFont);
		  console.log("fixed font: " + font);
		  console.log("#####");
	  }
	  
	  return font;
  }

  
  //
  // Public functions
  //

  // Load CPC file from URL
  that.load = function(url, onload)
  {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);
    xhr.responseType = "arraybuffer";

    if (that.progressMsg)
    {
      xhr.onprogress = function(e)
      {
        if (e.total && e.loaded) that.progressMsg(e.loaded, e.total);
      };
    }

    xhr.onload = function()
    {
      try
      {
        that.setData(new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer));
      }
      catch (e)
      {
        console.log("Data error: " + e);
      }

      if (onload) onload();
    };

    xhr.send();
  };


  // Set CPC data
  that.setData = function(a_data)
  {
    // Magic nummber: CPC2 == 43H 50H 43H 32H = 67 80 67 50
    if (a_data[0] != 67 || a_data[1] != 80 || a_data[2] != 67 || a_data[3] != 50)
    {
      console.log("[0]=" + a_data[0] + " [1]=" + a_data[1] + " [2]=" + a_data[2] + " [3]=" + a_data[3]);

      throw "Bad magic number - expected CPC2";
    }

    // Version
    if (a_data[4] != 0 || a_data[5] != 0)
    {
      throw "Bad version";
    }

    // CPC file seems ok
    m_data = a_data;
    m_offs = 6;
    m_normX = 0;
    m_normY = 0;

    m_images = [];

    // Pages
    m_numPages = readInt16();
    m_offsPages = readInt32();
    m_offsPageDir = readInt32();
    m_sizePageAddr = read();
    if (m_sizePageAddr < 1 || 4 < m_sizePageAddr) throw "Invalid size for page addresses";
    m_readPageAddr = m_aread[m_sizePageAddr - 1];

    // Subrotines
    m_numSubr = readInt32();
    m_offsSubr = readInt32();
    m_offsSubrDir = readInt32();
    m_sizeSubrAddr = read();
    if (m_sizeSubrAddr < 1 || 4 < m_sizeSubrAddr) throw "Invalid size for subroutine addresses";
    m_readSubrAddr = m_aread[m_sizeSubrAddr - 1];

    // Strings
    m_numSid = readInt16();
    m_offsSid = readInt32();

    // Fonts
    m_numFonts = readInt16();
    m_offsFonts = readInt32();

    // Images
    m_numImages = readInt16();
    m_offsImages = readInt32();
    m_offsImageDir = readInt32();
    m_sizeImageAddr = read();

    // Offset to bookmarks and size
    m_offsBkmk = readInt32();
    /*m_sizeBkmk =*/readInt32();

    // Load strings
    m_asid = [];

    moveTo(m_offsSid);

    for (var i = 0; i < m_numSid; ++i)
    {
      m_asid.push(fixFont(readString()));
    }

    // Load graphics
    moveTo(m_offsImages);

    var mime, size, data;

    for (var i = 0; i < m_numImages; ++i)
    {
      switch (read())
      {
        case 1:
          addImage(readString());
          break;

        case 2:
          mime = readString();
          size = readUInt();
          data = readBytesToString(size);
          addImage("data:" + mime + ";base64," + btoa(data));
          break;
      }
    }
  };


  // Number of pages
  that.getNumPages = function()
  {
    return m_numPages;
  };


  // Page dimension of nth page
  that.getPageDim = function(a_pageNo)
  {
    if (a_pageNo < 1 || m_numPages < a_pageNo) throw "Page out of range: " + a_pageNo;

    var offsSave = m_offs;

    moveTo(m_offsPageDir + (a_pageNo - 1) * m_sizePageAddr);
    moveTo(m_offsPages + m_readPageAddr());

    var r = null;

    if (read() == 0)
    {
      // Don't dare to use r = {w: readUInt(), h: readUInt() }, because of unknown (to me) evaluation order
      r = {};
      r.w = readUInt();
      r.h = readUInt();
    }

    moveTo(offsSave);

    if (!r) throw "Invalid file";

    return r;
  };

  // Get bookmarks
  that.getBookmarks = function()
  {
    if (!m_offsBkmk) return null;

    // Load bookmarks
    var offsSave = m_offs;
    moveTo(m_offsBkmk);
    var bookmarks = loadBookmarks();
    moveTo(offsSave);

    return bookmarks;
  };

  // Get fonts
  that.getFonts = function()
  {
    if (!m_offsFonts) return null;

    var fonts = [];

    moveTo(m_offsFonts);

    for (var fid = 0; fid < m_numFonts; ++fid)
    {
      var font = { family: readString() };

      var style = read();
      if (style) font.style = aFontStyle[style - 1];

      var weight = read();
      if (weight) font.weight = aFontWeight[weight - 1];

      var stretch = read();
      if (stretch) font.stretch = aFontStretch[stretch - 1];

      var unicodeRange = readString();
      if (unicodeRange.length > 0) font.unicodeRange = unicodeRange;

      var _1, _2;
      var numSrc = readUInt();

      if (numSrc > 0)
      {
        font.srcs = [];

        for (var i = 0; i < numSrc; ++i)
        {
          var src = {};

          switch (read())
          {
            case 1: // local
              src.local = readString();
              break;

            case 2: // url + type
              src.url = readString();
              _1 = readString();
              if (_1.length > 0) src.format = _1;
              break;

            case 3: // data
              _1 = readString(); // mime
              src.size = readUInt();
              _2 = readBytesToString(src.size);
              src.url = "data:" + _1 + ";base64," + btoa(_2);
              break;
          }

          font.srcs.push(src);
        }
      }

      fonts.push(font);
    }

    return fonts;
  };

  // Print page
  that.printPage = function(a_canvas, a_pageNo, options, a_firstRenderPage)
  {
    if (a_pageNo < 1 || m_numPages < a_pageNo) throw "Bad page: " + a_pageNo;

    // Save
    var offsSave = m_offs;
    var canvasSave = m_canvas;
    var pageSave = m_pageNo;
    var ctxSave = m_ctx;
    var scaleX_save = m_scaleX;
    var scaleY_save = m_scaleY;
    var offsX_save = m_offsX;
    var offsY_save = m_offsY;

    // Print pages
    try
    {
      // Save
      m_canvas = a_canvas;
      m_pageNo = a_pageNo;
      m_ctx = m_canvas.getContext("2d");
      m_ctx.save();
	  if(a_firstRenderPage && a_firstRenderPage != -1)
		m_firstPageNo = a_firstRenderPage;

      a_canvas.cpcHotspots = null;

      if (!a_canvas.hasCpcEventHandlers)
      {
//        a_canvas.onmousemove = function(event) { mouseMove(event, a_canvas); };
//        a_canvas.onclick = function(event) { mouseClick(event, a_canvas); };
        a_canvas.hasCpcEventHandlers = true;
      }

      moveTo(m_offsPageDir + (m_pageNo - 1) * m_sizePageAddr);

      var start = m_offsPages + m_readPageAddr();
      var end = m_offsPages + m_readPageAddr();
      var numC = command.length;

      moveTo(start);

      // Clear canvas
      m_ctx.clearRect(0, 0, m_canvas.width, m_canvas.height);

      // Transformation?
      if (options)
      {
        if (options.scale) m_scaleX = m_scaleY = options.scale;
        if (options.scaleX) m_scaleX = options.scaleX;
        if (options.scaleY) m_scaleY = options.scaleY;
        if (options.offsX) m_offsX = options.offsX;
        if (options.offsY) m_offsY = options.offsY;

        m_ctx.transform(m_scaleX, 0, 0, m_scaleY, m_offsX, m_offsY);

        a_canvas.cpcOptions = { scaleX: m_scaleX, scaleY: m_scaleY, offsX: m_offsX, offsY: m_offsY };
      }
      else
      {
        a_canvas.cpcOptions = null;
      }

      // Paint page
      while (m_offs < end)
      {
        var cmd = read();

        if (0 <= cmd && cmd <= numC)
        {
          command[cmd]();
        }
        else
        {
          throw "Invalid drawing command: " + cmd;
        }
      }
    }
    catch (e)
    {
      console.log("Error: " + e);
    }

    // Release allocated gradients
    m_gradients = null;

    // Restore
    m_scaleX = scaleX_save;
    m_scaleY = scaleY_save;
    m_offsX = offsX_save;
    m_offsY = offsY_save;
    m_ctx.restore();
    m_canvas = canvasSave;
    m_pageNo = pageSave;
    m_ctx = ctxSave;
    moveTo(offsSave);
  };

  // goto URL
  that.gotoURL = function(a_url)
  {
  	console.log("gotoURL: " + a_url);
	var str1="javascript:"
	var str2="openURILink";
	var str3="openLinkDoc";
	var str4 = "('";
	var str5 = "')";
	var index=a_url.indexOf(str1+str2);
	var index2=a_url.indexOf(str1+str3);
	var index5=a_url.indexOf(str5);
	var docID = a_url;
	if(index!=-1 && index5 != -1) // if its URI link to assembly or external
	{
		var index3=a_url.indexOf(str4);
		if(index3!=-1)
		{
			docID = a_url.substring(index3+2,index5);
			console.log("docId=" + docID);
			//openURILink(docID);
		}
		else
			console.log("we don't support URL: " + a_url);
	}
	else if(index2 != -1 && index5 != -1)
	{
		var index4=a_url.indexOf(str4);
		if(index4!=-1)
		{
			docID = a_url.substring(index4+2,index5);
			console.log("docId=" + docID);
			openLinkDoc(docID);
		}
		else
			console.log("we don't support URL: " + a_url);
	}
	else
	 console.log("we don't support URL: " + a_url);

  };

/*
    // goto Page in same chunk 
  that.gotoPage = function(a_page,a_offs)
  {
	console.log("gotoPage: " + a_page);
	var obj = event.target.parentElement.parentElement;
	var targetPage = $(obj).find("#"+"Canvas_Page" + a_page);
	if($(targetPage).length) 
	{
		if(a_offs == 0)
			$(targetPage)[0].scrollIntoView();
		else //to do focus according given offset
		{
			$(targetPage)[0].scrollIntoView();
			//var pageTop = $(targetPage).offset().top + a_offs;
			//$(obj).animate({scrollTop: pageTop}, "fast");
		}
	}
	else //to do create url , we can't focus because target page was removed, so we should send link url with docId and page number
	;
  };
*/

  // The print command handlers
  var command =
  [
  // newPage 0
  function()
  {
    var w = readUInt();
    var h = readUInt();

    m_normX = w / 2;
    m_normY = h / 2;
  },

  // save 1
  function()
  {
    m_ctx.save();
  },

  // restore 2
  function()
  {
    m_ctx.restore();
  },

  // fillStyle_color 3
  function()
  {
    m_ctx.fillStyle = getSid(readUInt());
  },

  // fillStyle_gradient 4
  function()
  {
    m_ctx.fillStyle = getGradient(readUInt());
  },

  // fillStyle_pattern 5
  function()
  {
    throw "Implement fillStyle_pattern";
  },

  // strokeStyle_color 6
  function()
  {
    m_ctx.strokeStyle = getSid(readUInt());
  },

  // strokeStyle_gradient 7
  function()
  {
    m_ctx.strokeStyle = getGradient(readUInt());
  },

  // strokeStyle_pattern 8
  function()
  {
    throw "Implement strokeStyle_pattern";
  },

  // shadowColor 9
  function()
  {
    m_ctx.shadowColor = getSid(readUInt());
  },

  // shadowBlur  10
  function()
  {
    m_ctx.shadowBlur = readNumber();
  },

  // shadowOffsetX 11
  function()
  {
    m_ctx.shadowOffsetX = readNumber();
  },

  // shadowOffsetY 12
  function()
  {
    m_ctx.shadowOffsetY = readNumber();
  },

  // createLinearGradient 13
  function()
  {
    var id = readUInt();
    var x0 = readCoordX();
    var y0 = readCoordY();
    var x1 = readCoordX();
    var y1 = readCoordY();

    if (!m_gradients) m_gradients = [];

    m_gradients[id] = m_ctx.createLinearGradient(x0, y0, x1, y1);
  },

  // createPattern 14
  function()
  {
    throw "Implement createPattern";
  },

  // createRadialGradient 15
  function()
  {
    var id = readUInt();
    var x0 = readCoordX();
    var y0 = readCoordY();
    var r0 = readNumber();
    var x1 = readCoordX();
    var y1 = readCoordY();
    var r1 = readNumber();

    if (!m_gradients) m_gradients = [];

    m_gradients[id] = m_ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  },

  // addColorStop 16
  function()
  {
    var id = readUInt();
    var stop = readNumber();
    var color = getSid(readUInt());

    getGradient(id).addColorStop(stop, color);
  },

  // lineCap 17
  function()
  {
    var join = readUInt();

    if (0 <= join && join < m_aLineCap.length)
    {
      m_ctx.lineCap = m_aLineCap[join];
    }
  },

  // lineJoin 18
  function()
  {
    var join = readUInt();

    if (0 <= join && join <= m_aLineJoin.length)
    {
      m_ctx.lineJoin = m_aLineJoin[join];
    }
  },

  // lineWidth 19
  function()
  {
    m_ctx.lineWidth = readNumber();
  },

  // miterLimit 20
  function()
  {
    m_ctx.miterLimit = readNumber();
  },

  // rect 21
  function()
  {
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    m_ctx.rect(x, y, w, h);
  },

  // fillRect 22
  function()
  {
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    m_ctx.fillRect(x, y, w, h);
  },

  // strokeRect 23
  function()
  {
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    m_ctx.strokeRect(x, y, w, h);
  },

  // clearRect 24
  function()
  {
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    m_ctx.clearRect(x, y, w, h);
  },

  // fill 25
  function()
  {
    m_ctx.fill();
  },

  // stroke 26
  function()
  {
    m_ctx.stroke();
  },

  // beginPath 27
  function()
  {
    m_ctx.beginPath();
  },

  // moveTo 28
  function()
  {
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.moveTo(x, y);
  },

  // closePath 29
  function()
  {
    m_ctx.closePath();
  },

  // lineTo 30
  function()
  {
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.lineTo(x, y);
  },

  // clip 31
  function()
  {
    m_ctx.clip();
  },

  // quadraticCurveTo 32
  function()
  {
    var cpx = readCoordX();
    var cpy = readCoordY();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.quadraticCurveTo(cpx, cpy, x, y);
  },

  // bezierCurveTo 33
  function()
  {
    var cp1x = readCoordX();
    var cp1y = readCoordY();
    var cp2x = readCoordX();
    var cp2y = readCoordY();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  },

  // arc 34
  function()
  {
    var x = readCoordX();
    var y = readCoordY();
    var r = readNumber();
    var sAngle = readNumber();
    var eAngle = readNumber();
    var clockwise = read();

    m_ctx.arc(x, y, r, sAngle, eAngle, clockwise != 0);
  },

  // arcTo 35
  function()
  {
    var x1 = readCoordX();
    var y1 = readCoordY();
    var x2 = readCoordX();
    var y2 = readCoordY();
    var r = readNumber();

    m_ctx.arcTo(x1, y1, x2, y2, r);
  },

  // scale 36
  function()
  {
    var scalewidth = readNumber();
    var scaleheight = readNumber();

    m_ctx.scale(scalewidth, scaleheight);
  },

  // rotate 37
  function()
  {
    m_ctx.rotate(readNumber());
  },

  // translate 38
  function()
  {
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.translate(x, y);
  },

  // transform 39
  function()
  {
    var a = readNumber();
    var b = readNumber();
    var c = readNumber();
    var d = readNumber();
    var e = readNumber();
    var f = readNumber();

    m_ctx.transform(a, b, c, d, e, f);
  },

  // setTransform 40
  function()
  {
    var a = readNumber();
    var b = readNumber();
    var c = readNumber();
    var d = readNumber();
    var e = readNumber();
    var f = readNumber();

    m_ctx.setTransform(a, b, c, d, e, f);
  },

  // font 41
  function()
  {
    m_ctx.font = getSid(readUInt());
  },

  // textAlign 42
  function()
  {
    var align = read();

    if (0 <= align && align < m_aTextAlign.length)
    {
      m_ctx.textAlign = m_aTextAlign[align];
    }
  },

  // textBaseline 43
  function()
  {
    var b = read();

    if (0 <= b && b <= m_aBaseLine.length)
    {
      m_ctx.textBaseline = m_aBaseLine[b];
    }
  },

  // fillText_xy 44
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.fillText(s, x, y);
  },

  // fillText_xyw 45
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();
    var maxw = readNumber();

    m_ctx.fillText(s, x, y, maxw);
  },

  // fillTextW 46
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var w2 = m_ctx.measureText(s).width;

    if (w2 != w && w != 0 && w2 != 0)
    {
      m_ctx.translate(x, y);
      m_ctx.transform(w / w2, 0, 0, 1, 0, 0);
      m_ctx.fillText(s, 0, 0);
      m_ctx.transform(w2 / w, 0, 0, 1, 0, 0);
      m_ctx.translate(-x, -y);
    }
    else
    {
      m_ctx.fillText(s, x, y);
    }
  },

  // fillChar_xy 47
  function()
  {
    var c = readChar();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.fillText(c, x, y);
  },

  // strokeText_xy 48
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.strokeText(s, x, y);
  },

  // strokeText_xyw 49
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();
    var maxw = readNumber();

    m_ctx.strokeText(s, x, y, maxw);
  },

  // strokeTextW 50
  function()
  {
    var s = readString();
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var w2 = m_ctx.measureText(s).width;

    if (w2 != w && w != 0 && w2 != 0)
    {
      m_ctx.translate(x, y);
      m_ctx.transform(w / w2, 0, 0, 1, 0, 0);
      m_ctx.strokeText(s, 0, 0);
      m_ctx.transform(w2 / w, 0, 0, 1, 0, 0);
      m_ctx.translate(-x, -y);
    }
    else
    {
      m_ctx.strokeText(s, x, y);
    }
  },

  // strokeChar_xy 51
  function()
  {
    var c = readChar();
    var x = readCoordX();
    var y = readCoordY();

    m_ctx.strokeText(c, x, y);
  },

  // drawImage_xy 52
  function()
  {
    var i = readUInt();
    var x = readCoordX();
    var y = readCoordY();
    var img = getImage(i);

    if (img) m_ctx.drawImage(img, x, y);
  },

  // drawImage_xywh 53
  function()
  {
    var i = readUInt();
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    var img = getImage(i);

    if (img) m_ctx.drawImage(img, x, y, w, h);
  },

  // drawImage_ext 54
  function()
  {
    var i = readUInt();
    var sx = readCoordX();
    var sy = readCoordY();
    var sw = readNumber();
    var sh = readNumber();
    var x = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var h = readNumber();

    var img = getImage(i);

    if (img) m_ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  },

  // globalAlpha 55
  function()
  {
    m_ctx.globalAlpha = readNumber();
  },

  // globalCompositeOperation 56
  function()
  {
    var co = read();

    if (0 <= co && co < m_aComposition.length)
    {
      m_ctx.globalCompositeOperation = m_aComposition[co];
    }
  },
  // drawHrule 57
  function()
  {
    var x1 = readCoordX();
    var x2 = readCoordX();
    var y = readCoordY();
    var w = readNumber();
    var dw = readNumber();
    var num = Math.round((x2 - x1) / (dw + w));

    if (num <= 1)
    {
      dw = (y2 - y1 - w) / 2;
      m_ctx.fillRect(x1, y, dw, w);
      m_ctx.fillRect(x2 - dw, y, dw, w);
    }
    else
    {
      var varw = x2 - x1 - num * dw;
      for (var i = 0; i < num; i++)
      {
        m_ctx.fillRect(x1 + (i * varw) / (num - 1), y, dw, w);
        x1 += dw;
      }
    }
  },
  // drawVrule 58
  function()
  {
    var y1 = readCoordY();
    var y2 = readCoordY();
    var x = readCoordX();
    var w = readNumber();
    var dw = readNumber();
    var num = Math.round((y2 - y1) / (dw + w));

    if (num <= 1)
    {
      dw = (y2 - y1 - w) / 2;
      m_ctx.fillRect(x, y1, w, dw);
      m_ctx.fillRect(x, y2 - dw, w, dw);
    }
    else
    {
      var varw = y2 - y1 - num * dw;
      for (var i = 0; i < num; i++)
      {
        m_ctx.fillRect(x, y1 + (i * varw) / (num - 1), w, dw);
        y1 += dw;
      }
    }
  },
  // linkInternal 59
  function()
  {
    var x = readCoordX() * m_scaleX + m_offsX;
    var y = readCoordY() * m_scaleY + m_offsY;
    var w = readNumber() * m_scaleX;
    var h = readNumber() * m_scaleY;
    var page = readNumber() + m_firstPageNo - 1; //put absolute number of page
    var desty = readNumber();

    if (!m_canvas.cpcHotspots) m_canvas.cpcHotspots = [];

    m_canvas.cpcHotspots.push({ x1: x, y1: y, x2: x + w, y2: y + h, page: page, offs: desty });
  },
  //linkExternal 60
  function()
  {
    var x = readCoordX() * m_scaleX + m_offsX;
    var y = readCoordY() * m_scaleY + m_offsY;
    var w = readNumber() * m_scaleX;
    var h = readNumber() * m_scaleY;
    var url = readString();

    if (!m_canvas.cpcHotspots) m_canvas.cpcHotspots = [];

    m_canvas.cpcHotspots.push({ x1: x, y1: y, x2: x + w, y2: y + h, url: url });
  },
  // id_sideBarPath 61
  function()
  {
    var side = read();
    var x1 = readCoordX();
    var y1 = readCoordY();
    var x2 = readCoordX();
    var y2 = readCoordY();
    var d1 = readNumber();
    var d2 = readNumber();

    m_ctx.beginPath();

    switch (side)
    {
      case 0: // left
        m_ctx.moveTo(x1, y1);
        m_ctx.lineTo(x2, y1 + d1);
        m_ctx.lineTo(x2, y2 - d2);
        m_ctx.lineTo(x1, y2);
        m_ctx.lineTo(x1, y1);
        break;

      case 1: // top
        m_ctx.moveTo(x1, y1);
        m_ctx.lineTo(x1 + d1, y2);
        m_ctx.lineTo(x2 - d2, y2);
        m_ctx.lineTo(x2, y1);
        m_ctx.lineTo(x1, y1);
        break;

      case 2: // right
        m_ctx.moveTo(x2, y1);
        m_ctx.lineTo(x1, y1 + d1);
        m_ctx.lineTo(x1, y2 - d2);
        m_ctx.lineTo(x2, y2);
        m_ctx.lineTo(x2, y1);
        break;

      case 3: // bottom
        m_ctx.moveTo(x1, y2);
        m_ctx.lineTo(x1 + d1, y1);
        m_ctx.lineTo(x2 - d2, y1);
        m_ctx.lineTo(x2, y2);
        m_ctx.lineTo(x1, y2);
        break;
    }

    m_ctx.closePath();
  },
  // id_callSubr 62
  function()
  {
    var subr = readUInt();

    if (subr < 1 || m_numSubr < subr) throw "Bad subrotine id: " + subr;

    // Save
    var offs_save = m_offs;
    var normX_save = m_normX;
    var normY_save = m_normY;
    m_normX = 306;
    m_normY = 396;
    //m_ctx.save();

    // Get offset and size of subrotine
    moveTo(m_offsSubrDir + (subr - 1) * m_sizeSubrAddr);
    var start = m_offsSubr + m_readSubrAddr();
    var end = m_offsSubr + m_readSubrAddr();
    var numC = command.length;

    moveTo(start);

    // Run subrotine
    while (m_offs < end)
    {
      var cmd = read();

      if (0 <= cmd && cmd <= numC)
      {
        command[cmd]();
      }
      else
      {
        throw "Invalid drawing command: " + cmd + "in subroutine #" + subr;
      }
    }

    // restore
    m_normX = normX_save;
    m_normY = normY_save;
    //m_ctx.restore();
    moveTo(offs_save);
  }
  ];

  return that;
};

console.log("end loading cpcViewer.js");

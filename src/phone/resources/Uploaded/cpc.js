/**
 * Created by ogarber on 1/22/2017.
 */

var cpc = function(url, containerID, $scope) {
    console.log("cpc: url="+url+"; containerID="+containerID);

    var _STYLE_ID_ = "ENIGMA_CPC_FONT_STYLE_TAG";
    var g_printPage_options = { scale: 0.75 };

    var that = this;
    that.CpcViewer = cpcViewer();

    that.el = document.getElementById(containerID);

    that.onmyload = function(){
        console.log("Oleg: cpc. onload");
        console.log(CpcViewer.getNumPages());
        that.installFonts();
        setTimeout(function() { that.showPages(); }, 500);
    };


    that.installFonts = function()
    {
        console.log("Oleg: cpc. installFonts");

        // Fonts inside document
        var fonts = that.CpcViewer.getFonts();

        // Style element for fonts
        var el_style = document.getElementById(_STYLE_ID_);

        // Did document contain fonts?
        if (fonts && fonts.length)
        {
            if (!el_style)
            {
                el_style = document.createElement('style');
                el_style.id = _STYLE_ID_;
                document.documentElement.getElementsByTagName('head')[0].appendChild(el_style);
            }

            // Clear font style from fonts of previous documents
            for (var styleSheet = el_style.sheet; styleSheet.cssRules.length > 0; styleSheet.deleteRule(0));

            // Insert embedded fonts
            for (var i = 0; i < fonts.length; ++i)
            {
                var font = fonts[i];

                var src = "";

                for (var j = 0, len = font.srcs.length; j < len; ++j)
                {
                    var s = font.srcs[j];

                    if (j) src += ", ";

                    if (s.local)
                    {
                        src += "local('" + s.local + "')";
                    }
                    else if (s.url)
                    {
                        src += "url('" + s.url + "')";

                        if (s.format) src += " format('" + s.format + "')";
                    }
                }

                var fontAttr = "";

                if (font.style) fontAttr += " font-style:" + font.style + ";";
                if (font.weight) fontAttr += " font-weight:" + font.weight + ";";
                if (font.stretch) fontAttr += " font-stretch:" + font.stretch + ";";
                if (font.unicodeRange) fontAttr += " unicode-range:" + font.unicodeRange + ";";

                var rule = "@font-face { font-family:" + font.family + ";" + fontAttr + " src:" + src + "; }";

                //console.log("@font-face: " + font.family);

                styleSheet.insertRule(rule, styleSheet.cssRules.length);
            }
        }
        else if (el_style)
        {
            // Clear font style from fonts of previous documents
            for (var styleSheet = el_style.sheet; styleSheet.cssRules.length > 0; styleSheet.deleteRule(0));
        }
    };

    that.paintPages =  function()
    {
        console.log("Oleg: cpc. paintPages");

        var pages = CpcViewer.getNumPages();
        if (pages > 5)
            pages = 5;
        for (var i = 1; i <= pages; ++i)
        {
            var pageNum = i;
            that.CpcViewer.printPage(that.getCanvas(i), pageNum, g_printPage_options, 1);
        }

        //$("#pageInfo").html("Page " + g_firstPage + " to " + g_lastPage + " of " + g_numPages + " pages");
    };

    that.getCanvas = function(page)
    {
        return document.getElementById("Canvas_Page" + page);
    };

    that.showPages = function()
    {
        console.log("Oleg: cpc. showPages");
        that.emptyCanvases();

        var pages = CpcViewer.getNumPages();
        if (pages > 5)
            pages = 5;
        for (var i = 1; i <= pages; ++i)
        {
            var pageNum = i;
            var r = that.CpcViewer.getPageDim(pageNum);
            var left = ((r.w * g_printPage_options.scale) - 120 ) / 2;
            that.el.innerHTML += "<div><div style='height:5px;'></div><canvas id='Canvas_Page" + i + "' width='" + r.w * g_printPage_options.scale + "' height='" + r.h * g_printPage_options.scale + "' style='border:1px solid black;margin:0pt;'>Canvas not supported</canvas><div id='pageNoDiv' style='margin-left:"+left+"px;'>Page " + i + " of " + pages + "</div></div>";
        }
        that.paintPages();
    };


    that.emptyCanvases = function() {
        el.innerHTML = "";
    };
    
    CpcViewer.$scope = $scope;

    that.el.innerHTML = "<div class='doc-placeholder'>Loading Service Information ...</div>";
    CpcViewer.load(url, function (){
        console.log("Oleg: CpcViewer. load");
        that.onmyload();
    });

}

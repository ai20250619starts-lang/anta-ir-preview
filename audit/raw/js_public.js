

$(function(){
	// mobile check
	var isMobile = (function(a){return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);
	var tevent = isMobile ? "tap" : "click";
	console.log(tevent);
	var $w320 = $(".w320"),
		$w1025 = $(".w1025"),
		$banner = $("#banner"),
		$innerBanner = $(".inner-banner"),
		$head = $("header"),
		$footer = $("footer");
	var anta = {
		// head scroll
		ScrollHead: function(){
			var $stop = $(window).scrollTop();
			var $indexAbout = $(".home-about");
			$(window).scroll(function(){
				$stop = $(window).scrollTop();
				if($stop > 35){
					$head.addClass('scrolled');
				}else{
					$head.removeClass('scrolled');
				}
			}).scroll();
			if($w1025.is(":visible")){
				$(window).scroll(function(){
					$banner.css("top", $stop*0.6);
					$innerBanner.css("top", $stop*0.6);
					$indexAbout.css("background-position", "center "+(-$stop*0.333)+"px");
				});
			}
		},
		// phone nav
		PhoneNav: function(){
			var $menu = $("#menu"),
				$phone = $("#phone"),
				$navBox = $phone.find(".menu-box"),
				$nbh = $navBox.actual("outerHeight"),
				$navList = $phone.find("ul.menu-list"),
				$navLi = $navList.find(">li"),
				$navBottom = $phone.find(".menu-bottom"),
				$dt = $navList.find("dt > a"),
				$st = $(window).scrollTop(),
				$hasChild = $phone.find(".has-child"),
				$nav = $("#nav");
			var trans = {
				WebkitTransitionDuration: ".4s",
				MozTransitionDuration: ".4s",
				TransitionDuration: ".4s"
			}
			<!--$navBox.height($(window).height());-->
			$(window).scroll(function(){
				$st = $(window).scrollTop();
			});
			$menu.on("click", function(e){
				e.preventDefault();
				var $h = $(window).height();
				$nav.height($h);
				$(this).toggleClass("clicked");
				$head.toggleClass('menu-show');
				$navBox.css("top", $st);
				$phone.fadeToggle(function(){
					// $navLi.css(trans);
					$navList.toggleClass('menu-active');
					// setTimeout(function(){
					// 	$navBottom.fadeToggle();
					// }, 800);
					if(!$w1025.is(":visible")){
						dt();
						$navLi.css(trans);
						setTimeout(function(){
							$navBottom.fadeToggle();
						}, 800);
					}
				});
			});
			if(!$w1025.is(":visible")){
				$hasChild.find(">a").on("click", function(e){
					e.preventDefault();
					$(this).next("ol").slideToggle();
				});
			}
			function dt(){
				$dt.on("click", function(e){
					e.preventDefault();
					$(this).parents("dl").parent().siblings().find("dt").next().slideUp();
					$(this).parent().next().stop().slideToggle();
				});
			}
		},
		// index banner
		SetBannerHeight: function(){
			var $winw = $(window).width();
			var $winh = $(window).height();
			var $half = $winw/2;
			var $halfh = $winh/2;
			var $binfo = $banner.find(".b-info");
			// $(window).resize(function(){
			// 	$winW = $(window).width();
			// 	$winH = $(window).height();
			// 	$banner.width($winW).height($winH);
			// });
			$(window).resize(function(){
				if(!Modernizr.touch && $w1025.is(":visible")){
					Move();
				}else{
					$binfo.removeAttr('style');
				}
			}).trigger('resize');
			function Move(){
				$(window).on("mousemove", function(e){
					var x = e.clientX,
						y = e.clientY;
						// $binfo.css({marginLeft: -(x-$half)*0.01});
						$binfo.css({
							transformStyle : "preserve-3d",
							transform: "translate(-50%,-50%) rotateX("+(x-$half)*0.03+"deg) rotateY("+(y-$halfh)*0.03+"deg)"
						});
				});
			}

		},
		// set banner mouse
		SetBannerMouse: function(){
			var $wh,$bh,$ibh;
			var $mw = $banner.find('.mouse-box');
			var $innerBanner = $(".inner-banner");
			var $ibw = $innerBanner.find(".mouse-box");
			var $win_h = $(window).height();
			$(window).scroll(function(){
				var $st = $(window).scrollTop();
				if($st > 60){
					$mw.fadeOut();
					$ibw.fadeOut();
				}else{
					$mw.fadeIn();
					$ibw.fadeIn();
				}
			}).trigger("scroll");
			$(window).resize(function(){
				$("#banner .ban_item").height($win_h);
				var arr=[];
				for(var i=0;i<$('.home_fin_add_pc ul li .s-hover').length;i++){
					arr.push($('.home_fin_add_pc ul li .s-hover')[i].offsetHeight);
				}
				arr.sort(function(value1,value2){//排序
					return value2-value1;
				});
				//<=1025
				if($w1025.is(":visible")){
					$('.home_fin_add_pc ul li .s-hover').height(arr[0]);
				}else{
					$('.home_fin_add_pc ul li .s-hover').height('auto');
				}
				
				setTimeout(function(){
					$wh = $(window).height();
					$bh = $banner.height();
					$ibh = $innerBanner.height();
					if($wh < $bh){
						$mw.addClass("m-fixed");
					}else{
						$mw.removeClass("m-fixed");
					}
					if($wh < $ibh){
						$ibw.addClass("m-fixed");
					}else{
						$ibw.removeClass("m-fixed");
					}
				}, 150);
			}).trigger("resize");

			$('.ban_slick').slick({
			  dots:true,
			  infinite: true,
			  autoplay: true,
			  arrows:false,
			  speed: 500,
			  fade: true,
			  cssEase: 'linear'
			});

		},
		// single page scroll
		HashLink: function(){
			var $hash = $(window.location.hash);
			var $loc = window.location.href;
			var $hashTop = window.location.hash ? $hash.offset().top : undefined;
			var $hl = $(".hash-link"),
				$nw = $("#phone"),
				$nl = $nw.find("ul.menu-list"),
				$m = $("#menu");
			// console.log($hash);
			// console.log($hashTop);
			// console.log($loc);
			$("html,body").animate({scrollTop: $hashTop-66}, 500);
			if($loc.indexOf("brand.php")>0 || $loc.indexOf("financial.php")>0 || $loc.indexOf("news.php")>0){
				// console.log("a");
				$hl.on("click", function(){
					var $sid = $("#"+$(this).attr("href").split("#")[1]);
					var $ht = $sid.offset().top;
					$m.removeClass("clicked");
					$nl.removeClass("menu-active");
					$nw.fadeOut();
					$("html,body").animate({scrollTop: $ht-66}, 500);

				});
			}
		},
		// latest news phone scroll
		ulslick: function(){
			if($(".w320").is(":visible")){
				$('.home-news-wrap ul').slick({
			        prevArrow: ".prev",
					nextArrow: ".next"
			     });
			}
		},
		// set height
		AutoHeight: function(){
			var $mc = $(".mc-height"),
				$brandLi = $("ul.brand-logo-list > li"),
				$earnLi = $("ul.home-earnings-list > li"),
				$fList = $("ul.footer-sitemap > li"),
				$navList = $("ul.menu-list > li"),
				$ulInnerLi = $("ul.brand-overview-list li .content-list, ul.financial-report-list .content-list > a"),
				$finListLi = $("#article").find("ul.financial-list > li");
			$mc.matchHeight();
			$brandLi.matchHeight();
			$earnLi.matchHeight();
			$fList.matchHeight();
			$ulInnerLi.matchHeight();
			// $navList.matchHeight();
			$finListLi.matchHeight();
		},
		// year select
		YearSelect: function(){
			var $yearList = $("ul.y-list"),
				$yearLi = $yearList.find(" > li"),
				$span = $yearList.find(".y-selected");
			if($w1025.is(":visible")){
				$yearLi.hover(function(){
					$(this).find("ol").fadeIn();
				}, function(){
					$(this).find("ol").fadeOut();
				});
			}else{
				$span.on(tevent, function(){
					$(this).next().fadeToggle();
				});
			}
		},
		// ngprogress
		NG: function(){
			NProgress.start();
			$(window).load(function() {
				NProgress.done();
			});
		},
		// footer fixed
		FootFix: function(){
			var $f = $("footer"),
				$fh = $f.outerHeight(true),
				$article = $("#article");
			// $article.css("margin-bottom",$fh);
			$(window).resize(function(){
				if($w1025.is(":visible")){
					$fh = $f.outerHeight();
					$article.css("margin-bottom",$fh);
				}else{
					$article.removeAttr("style");
				}
			}).resize();
		},
		Fixie: function(){
			if(navigator.userAgent.match(/Trident\/7\./)) {
				document.body.addEventListener("mousewheel", function(event) {
					event.preventDefault();
					var wd = event.wheelDelta;
					var csp = window.pageYOffset;
					window.scrollTo(0, csp - wd);
				});
			}
		},
		// intrest show
		FootInstrest: function(){
			var $wh = $(window).height(),
				$doc = $(document).height(),
				$st = $(window).scrollTop(),
				$ins = $(".popup"),
				$o = 5,
				$sb = $("#sb"),
				$sc = $("#second"),
				$t = true;
			$(window).scroll(function(){
				if($banner.length){
					if(isScrolledIntoView($sc) && $t){
						$ins.fadeIn();
					}
				}else{
					if(isScrolledIntoView($sb) && $t){
						$ins.fadeIn();
					}else{
						$ins.fadeOut();
					}
				}
			});
			$ins.on(tevent, function(e){
				if($(e.target).is(".popup-box,.popup-box > *,.popup-box .content-list")){
					return false;
				}else{
					$(this).fadeOut();
					$t = false;
				}
			});
		},
		// scroll fadein
		ScrollIn: function(){
			$(window).scroll(function(){
				var $article = $("#article");
				var $first = $("#first"),
					$indexStock = $article.find(".home-stock"),
					$indexNews = $article.find(".home-news");
				if(isScrolledIntoView($first)){
					$indexStock.stop().animate({opacity: 1}, 300, function(){
						$indexNews.stop().animate({opacity: 1}, 300);
					});
				}/*else{
					$indexStock.stop().animate({opacity: 0}, 200);
					$indexNews.stop().animate({opacity: 0}, 200);
				}*/
				var $second = $("#second"),
					$indexAbout = $article.find(".home-about");
				if(isScrolledIntoView($second)){
					$indexAbout.stop().animate({opacity: 1}, 300);
				}/*else{
					$indexAbout.stop().animate({opacity: 0}, 200);
				}*/
				var $third = $("#third"),
					$indexBrand = $article.find(".home-brand");
				if(isScrolledIntoView($third)){
					$indexBrand.stop().animate({opacity: 1}, 300);
				}
				var $four = $("#four"),
					$indexEarn = $article.find(".home-earnings"),
					$indexFin = $article.find(".home-fin");
				if(isScrolledIntoView($four)){
					$indexEarn.animate({opacity: 1}, 300, function(){
						$indexFin.animate({opacity: 1}, 300);
					});
				}
			}).scroll();
		},
		SetContactForm: function(){
			var $form = $("#form"),
				$r = $form.find(".r");
			$form.submit(function(){
				for(var i=0; i<$r.length;i++){
					var $val = $r.eq(i).find("input,textarea").val();
					if($val == ""){
						return false;
					}
				}
				return true;
			});
		},
		// set seatch
		SetSearch: function(){
			var $pcsearch = $("a.search");
			var $sw = $(".search-wrap");
			$pcsearch.on("click", function(){
				$sw.toggle();
				$sw.find("input").focus();
				return false;
			});
			var $search = $("input[name=search]");
			$search.bind('keypress',function(e){
		        if(event.keyCode == "13"){
		        	window.location = "search.php";
		        }
		    });
		},
		// js fin
		SetFin: function(){
		   
			var $finContent = $("#financial-content"),
				$contentBox = $("#content-box"),
				$iPage = $("#article"),
				$hasMenu = $iPage.find(".has-content"),
				$contentClose = $("#close"),
				$reportUl = $iPage.find("ul.financial-list"),
				$reportLi = $reportUl.find(" > li"),
				$eList = $reportUl.find("ul.e-list"),
				$F_id;

			$reportLi.on("click", function(){
				if($(this).find($eList).length > 0){
					$eList.fadeIn(200);
				}else{
					$eList.fadeOut(100);
				}
			});
			

			var url = window.location.href; //获取url中"?"符后的字串   
		    if (url.indexOf("#") != -1) {  
		       
		       $F_id = url.split("#")[1];  
		    }  
		    


		    if($F_id == "f1"){
		    	$link = "financial_overview.php";
		    }else if($F_id == "f2"){
		    	$link = "financial_info.php";
		    }else if($F_id == "f3"){
		    	$link = "financial_highlight.php";
		    }else if($F_id == "f4"){
		    	$link = "financial_report.php";
		    }

		    if($F_id == "f1" || $F_id == "f3" ){
				$finContent.addClass("pop-right");
				$contentBox.load($link, function(){
					$(this).parent().animate({right: 0}, 500, "easeOutQuint");
					LoadThis();
				});
			}else if($F_id == "f2" || $F_id == "f4" ){
				$finContent.addClass("pop-left");
				$contentBox.load($link, function(){
					$(this).parent().animate({left: 0}, 500, "easeOutQuint");
					LoadThis();
				});
			}


			$hasMenu.on("click", function(){
				var $link = $(this).attr("data-href");
				if($(this).hasClass("p-right")){
					$finContent.addClass("pop-right");
					$contentBox.load($link, function(){
						$(this).parent().animate({right: 0}, 500, "easeOutQuint");
						// anta.YearSelect();
						// FinSelect();
						// $contentBox.niceScroll({
						// 	cursorcolor: "#fff"
						// });
						LoadThis();
					});
				}else{
					$finContent.addClass("pop-left");
					$contentBox.load($link, function(){
						$(this).parent().animate({left: 0}, 500, "easeOutQuint");
						// anta.YearSelect();
						// FinSelect();
						// $contentBox.niceScroll({
						// 	cursorcolor: "#fff"
						// });
						LoadThis();
					});
				}
			});
			$contentClose.on("click", function(){
				if($(this).parent().hasClass("pop-right")){
					$(this).parent().animate({right: "-100%"}, 500, "easeOutQuint", function(){
						$(this).removeClass("pop-right").removeAttr("style");
					});
				}else{
					$(this).parent().animate({left: "-100%"}, 500, "easeOutQuint", function(){
						$(this).removeClass("pop-left").removeAttr("style");
					});
				}
			});
			$(".pup-close").click(function(){
        $(".pup-main").hide();
    });
			function LoadThis(){
				// var $cid = $("#c-id");
				// console.log($cid);
				anta.YearSelect();
				FinSelect();
				SwipeHide();
				$contentBox.niceScroll({
					cursorcolor: "#fff"
				});
				// $cid.niceScroll({
				// 	cursorcolor: "#fff"
				// });
				$(".fancy").fancybox({
			    	maxWidth: 900,
			    	maxHeight: 800
			    });
				var $frl = $("ul.financial-report-list"),
					$frlPrev = $("a.prev"),
					$frlNext = $("a.next"),
					$ry = $("span.report-year"),
					i = 0;
					l = $frl.find('li').length/2;
				$frl.slick({
					slidesToShow: 2,
					slidesToScroll: 2,
					infinite: false,
					prevArrow: ".prev",
					nextArrow: ".next",
					// responsive: [
					// 	{
					// 		breakpoint: 768,
					// 	    settings: {
					// 	        slidesToShow: 2
					// 	    }
					// 	}
					// ]
				});
				$frlNext.on("click", function(){
					sleft();
				});
				$frl.on('swipeleft', function(){
				  	sleft();
				});
				$frlPrev.on("click", function(){
					sright();
				});
				$frl.on('swiperight', function(){
				  	sright();
				});
				function sleft(){
					if(i<(l-1)){
						$ry.find('b').text(parseInt($ry.find('b').text())-1);
						i++;
					}
				}
				function sright(){
					if(i>0){
						$ry.find('b').text(parseInt($ry.find('b').text())+1);
						i--;
					}
				}
				FinPer();
				setTimeout(function(){
					$("ul.financial-report-list li .content-list > a").matchHeight();
				}, 200);
			}
		},
		// set content title
		SetContentTitle: function(){
			var $ContentTitle = $(".content-title"),
				$li = $ContentTitle.find("ul>li");
			if(Modernizr.touch){
				$li.on("click", function(e){
					$(this).find("ol").stop().slideToggle();
				});
			}else{
				$li.hover(function(){
					$(this).find("ol").stop().slideDown();
				}, function(){
					$(this).find("ol").stop().slideUp();
				});
			}
		}
	};
	anta.NG();
	anta.ulslick();
	$(window).load(function(){
		anta.ScrollHead();
		anta.PhoneNav();
		anta.SetBannerHeight();
		anta.SetBannerMouse();
		anta.HashLink();
		anta.AutoHeight();
		anta.YearSelect();
		anta.FootFix();
		// anta.Fixie();
		anta.FootInstrest();
		anta.SetContactForm();
		anta.SetSearch();
		anta.SetFin();
		anta.SetContentTitle();
		$(window).resize(function(){
			if($banner.length>0 && $w1025.is(":visible")){
				anta.ScrollIn();
			}
			//if($w1025.is(":visible")){
//				var $n = $(".menu-box");
//				$n.niceScroll({
//					cursorcolor: "#fff"
//				});
//			}
		}).resize();
	});
	function isScrolledIntoView(elem) {
	    var docViewTop = $(window).scrollTop();
	    var docViewBottom = docViewTop + $(window).height();
	    var elemTop = $(elem).offset().top;
	    var elemBottom = elemTop + $(elem).height();
	    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom));
    }
    function FinSelect(){
    	var $yb = $(".y-box"),
    		$yt = $yb.find(".t-year"),
    		$ys = $yb.find(".y-selected").find("b"),
    		$ya = $yb.find("ol").find("li").find("a"),
    		$lc = $("#list-select");
    	$ya.on("click", function(){
    		var $fhref = $(this).attr("data-href");
    		var $thisyear = $(this).text();
    		$yt.text($thisyear);
    		$ys.text($thisyear);
    		$(this).parents("ol").hide();
    		$lc.load($fhref, function(){
    			console.log("loaded");
    		});
    	});
    }
    function FinPer(){
    	var $yb = $(".year-h1"),
    		$yt = $yb.find(".t-year"),
    		$ys = $yb.find(".y-selected").find("b"),
    		$ya = $yb.find("ol").find("li").find("a"),
    		$lc = $(".financial-performance");
    	$ya.on("click", function(){
    		var $fhref = $(this).attr("data-href");
    		var $thisyear = $(this).text();
    		$yt.text($thisyear);
    		$ys.text($thisyear);
    		$(this).parents("ol").hide();
    		$lc.load($fhref, function(){
    			console.log("loaded");
    			anta.YearSelect();
    			FinSelect();
    			SwipeHide();
    			var $frl = $("ul.financial-report-list"),
					$frlPrev = $("a.prev"),
					$frlNext = $("a.next"),
					$ry = $("span.report-year"),
					i = 0;
					l = $frl.find('li').length/2;
				$frl.slick({
					slidesToShow: 2,
					slidesToScroll: 2,
					infinite: false,
					prevArrow: ".prev",
					nextArrow: ".next"
				});
				$frlNext.on("click", function(){
					sleft();
				});
				$frl.on('swipeleft', function(){
				  	sleft();
				});
				$frlPrev.on("click", function(){
					sright();
				});
				$frl.on('swiperight', function(){
				  	sright();
				});
				function sleft(){
					if(i<(l-1)){
						$ry.find('b').text(parseInt($ry.find('b').text())-1);
						i++;
					}
				}
				function sright(){
					if(i>0){
						$ry.find('b').text(parseInt($ry.find('b').text())+1);
						i--;
					}
				}
    		});
    	});
    }
    function SwipeHide(){
    	var $sa = $("a.swipe-hand"),
    		$t = Modernizr.touch ? "touchstart" : "click";
    	$sa.on($t, function(){
    		$(this).fadeOut(100);
    	});
    }

    DirectorList();
    function DirectorList(){
    	var $dList = $("ul.dir-name-list"),
    		$dLi = $dList.find("li"),
    		$da = $dLi.find("a"),
    		$hh = $head.outerHeight(true);
    	$da.on("click", function(e){
    		e.preventDefault();
    		var $aid = $($(this).attr("href"));
    		var $aidTop = $aid.offset().top;
    		$("html,body").animate({scrollTop: $aidTop-$hh}, 500, "easeOutQuint");
    		return false;
    	});
    }

    $.fn.brandHeight = function(){
    	var $this = this;
    	var $p = $this.find(".p");
    	var $ph = 0;
    	var $pa = [];
    	var $max;
    	for(var i=0; i<$p.length; i++){
    		$ph = $p.eq(i).find("p").outerHeight(true);
    		$pa.push($ph);
    	}
    	$max = $pa[0];
    	for(var j=0; j<$pa.length; j++){
    		if($max <= $pa[j]){
    			$ma = $pa[j];
    		}
    	}
    	$p.height($max);
    };
    var $blist = $("ul.brand-overview-list"),
    	$p1 = $blist.find("li").eq(0),
    	$p2 = $blist.find("li").eq(1),
    	$p3 = $blist.find("li").eq(2),
		$p4 = $blist.find("li").eq(3);
    $(window).resize(function(){
    	if($w1025.is(":visible")){
    		$p1.brandHeight();
    		$p2.brandHeight();
    		$p3.brandHeight();
			$p4.brandHeight();
    	}else{
    		$blist.find(".p").removeAttr("style");
    	}
    }).trigger("resize");

    $.fn.fontFlex = function(min, max, mid) {
        var $this = this;
        $(window).resize(function() {
            var size = window.innerWidth / mid;
            if (size < min) size = min;
            if (size > max) size = max;
            $this.css('font-size', size + 'px');
        }).trigger('resize');
    };
    // console.log(window.location);
    var $tit = $(".home-title");
    var $box = $(".box");
    var $infoi = $(".info i");
    var tmax,tmin,bmax,bmin,imax,imin;
    var $bid = $("body").attr("id");
    // tmax = $bid == "en" ? 40 : 48;
    if($bid == "en"){
    	$tit.fontFlex(20,32,24);
    	$box.fontFlex(16,20,18);
    }else{
    	$tit.fontFlex(30,48,39);
    	$box.fontFlex(20,34,30);
    }
    // $box.fontFlex(20,34,30);
    $infoi.fontFlex(45,72,58);
    // $tit.fontFlex(30,tmax,39);
});


/*! Copyright 2012, Ben Lin (http://dreamerslab.com/)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 1.0.18
 *
 * Requires: jQuery >= 1.2.3
 *
 * Source: https://github.com/dreamerslab/jquery.actual
 *
 */
(function(a){if(typeof define==="function"&&define.amd){define(["jquery"],a);
}else{a(jQuery);}}(function(a){a.fn.addBack=a.fn.addBack||a.fn.andSelf;a.fn.extend({actual:function(b,l){if(!this[b]){throw'$.actual => The jQuery method "'+b+'" you called does not exist';
}var f={absolute:false,clone:false,includeMargin:false,display:"block"};var i=a.extend(f,l);var e=this.eq(0);var h,j;if(i.clone===true){h=function(){var m="position: absolute !important; top: -1000 !important; ";
e=e.clone().attr("style",m).appendTo("body");};j=function(){e.remove();};}else{var g=[];var d="";var c;h=function(){c=e.parents().addBack().filter(":hidden");
d+="visibility: hidden !important; display: "+i.display+" !important; ";if(i.absolute===true){d+="position: absolute !important; ";}c.each(function(){var m=a(this);
var n=m.attr("style");g.push(n);m.attr("style",n?n+";"+d:d);});};j=function(){c.each(function(m){var o=a(this);var n=g[m];if(n===undefined){o.removeAttr("style");
}else{o.attr("style",n);}});};}h();var k=/(outer)/.test(b)?e[b](i.includeMargin):e[b]();j();return k;}});}));
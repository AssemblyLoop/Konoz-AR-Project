$(document).ready(function () {
	"use strict";
if($(window).width()<500){
   
	}
var width = $(".navora").css( "width" );
$(".exit").click(function(){
	$(".navora ul").hide("0.5" , function(){
		$(".navora").css("width","50px");
		$(".navora").css("position","relative");
		$(".navora").css("left",$(".fixedbar").width());
		$(".showe").css("display","inline");
		$(".exit").css("display","none");
	});
});

   
    });

    
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
    $('.menue_ic').click(function(){
        $(".side_bar").toggleClass('left_po');
        $('.drop_down_conta').toggleClass('displaynon');
        $(".fas1").toggleClass('fas1_transform');
        $(".fas2").toggleClass('fas2_transform');
    })
    $('.drop_1').click(function(){
        $(".submenue_1").toggleClass('displaynon');
    });
    $('.drop_2').click(function(){
        $(".submenue_2").toggleClass('displaynon');
    })
    $('.drop_3').click(function(){
        $(".submenue_3").toggleClass('displaynon');
    })
    $('.drop_4').click(function(){
        $(".submenue_4").toggleClass('displaynon');
    })
    $('.drop_5').click(function(){
        $(".submenue_5").toggleClass('displaynon');
    })
    $('.drop_6').click(function(){
        $(".submenue_6").toggleClass('displaynon');
    })
    $('.drop_7').click(function(){
        $(".submenue_7").toggleClass('displaynon');
    })

    
});


    
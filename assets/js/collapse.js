// $( "#mydiv" ).hasClass( "foo" )
$(document).ready( function () {
    $(".btn-collapse1").unbind();
    $(".btn-collapse1").on("click", function () {
        if ($( ".collapse-body1 a.btn" ).hasClass( "collapsed" )) {
            $( ".collapse-body1 a.btn" ).css( {"border-bottom-left-radius": "6px","border-bottom-right-radius": "6px"} )
            $( ".collapse-body1" ).css( {"padding-bottom": "5px"} )
        } else {
            $( ".collapse-body1 a.btn" ).css( {"border-bottom-left-radius": "0px","border-bottom-right-radius": "0px"} )
            $( ".collapse-body1" ).css( {"padding-bottom": "0px"} )
        }
    });

    $(".btn-collapse2").unbind();
    $(".btn-collapse2").on("click", function () {
        if ($( ".collapse-body2 a.btn" ).hasClass( "collapsed" )) {
            $( ".collapse-body2 a.btn" ).css( {"border-bottom-left-radius": "6px","border-bottom-right-radius": "6px"} )
            $( ".collapse-body2" ).css( {"padding-bottom": "5px"} )
        } else {
            $( ".collapse-body2 a.btn" ).css( {"border-bottom-left-radius": "0px","border-bottom-right-radius": "0px"} )
            $( ".collapse-body2" ).css( {"padding-bottom": "0px"} )
        }
    });

    $(".btn-collapse3").unbind();
    $(".btn-collapse3").on("click", function () {
        if ($( ".collapse-body3 a.btn" ).hasClass( "collapsed" )) {
            $( ".collapse-body3 a.btn" ).css( {"border-bottom-left-radius": "6px","border-bottom-right-radius": "6px"} )
            $( ".collapse-body3" ).css( {"padding-bottom": "5px"} )
        } else {
            $( ".collapse-body3 a.btn" ).css( {"border-bottom-left-radius": "0px","border-bottom-right-radius": "0px"} )
            $( ".collapse-body3" ).css( {"padding-bottom": "0px"} )
        }
    });
});

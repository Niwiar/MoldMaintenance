$( "#ip_pdf" ).change(function() {
    // var y = $("ip_pdf").val();
    var fileSRC = document.getElementById("ip_pdf").value;
    console.log(fileSRC)
    document.getElementById('showQcPDF').src = fileSRC + "#view=FitH&#toolbar=1";
});
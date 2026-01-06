import jsPDF from "jspdf";
import html2canvas from "html2canvas";


export async function convertTableToPdf(tableElement) {
    if(!tableElement) return;

    
    tableElement.style.visibility = "visible"
    const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true
    });

    
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "pt", "letter");


    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    // pdf.save("Today's orders.pdf");

    
    const pdfURL = pdf.output('bloburl')
    window.open(pdfURL, "_blank")

    tableElement.style.visibility = "hidden"
}
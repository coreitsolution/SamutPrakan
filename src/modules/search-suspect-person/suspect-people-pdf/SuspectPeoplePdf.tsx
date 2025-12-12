import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

// Types
import {
  SuspectPersonSearch
} from "../../../features/search/SearchTypes"

// Utils
import {
  reformatString,
  getImageFormat,
  loadFont,
  getPersonTypeColor
} from "../../../utils/commonFunction"

export const generateSearchResultPdfBlob = async (
  data: SuspectPersonSearch[],
  t: (key: string) => string,
  i18n: any,
) => {

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const regularFontBase64 = await loadFont("/fonts/Sarabun-Regular.ttf");
    const boldFontBase64 = await loadFont("/fonts/Sarabun-Bold.ttf");
    const semiBoldFontBase64 = await loadFont("/fonts/Sarabun-SemiBold.ttf");

    doc.addFileToVFS("Sarabun-Regular.ttf", regularFontBase64);
    doc.addFileToVFS("Sarabun-Bold.ttf", boldFontBase64);
    doc.addFileToVFS("Sarabun-SemiBold.ttf", semiBoldFontBase64);

    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
    doc.addFont("Sarabun-SemiBold.ttf", "Sarabun", "semi-bold");

    doc.setFont("Sarabun", "normal");
  } catch (error) {
    console.warn("Failed to load Thai fonts, using default:", error);
  }

  // Page Header
  const addHeader = (pageNum: number, totalPages: number) => {
    doc.addImage("/project-logo/pdf-logo.png", "JPEG", 8, 3, 18, 15);
    doc.setFont("Sarabun", "semi-bold");
    doc.setTextColor("#2A2C2E");
    doc.setFontSize(12);
    doc.text(`${pageNum}/${totalPages}`, pageWidth - 5, 8, { align: "right" });
    doc.setFont("Sarabun", "semi-bold");
    doc.setFontSize(15);
    doc.text(t("pdf.suspect-people"), pageWidth / 2, 25, { align: "center" });
  };

  const itemsPerPage = 8;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  let y = 35;
  let currentPage = 1;
  addHeader(currentPage, totalPages);

  data.forEach((item, index) => {
    const remarkText = item.remark || "-";
    const remarkList = doc.setFont("Sarabun", "normal").setFontSize(12).splitTextToSize(remarkText, 130);
    
    const plusY = remarkList.length > 2 ? remarkList.length - 2 : 0;

    // Box outline
    doc.setDrawColor("#777777");
    doc.rect(5, y - 5, pageWidth - 10, (plusY * 6) + 40);

    // Box outline (Images)
    doc.setDrawColor("#777777");
    const imageBoxWidth = 35;
    doc.rect(5, y - 5, imageBoxWidth, (plusY * 6) + 40);

    // Images
    const personImage = item.imagesData ? `${item.imagesData.url}` : "/images/no_image.png";
    const imageX = 9.5;
    const imageY = y + 1 + (plusY * 4);
    const imageWidth = 26;
    const imageHeight = 26;

    doc.addImage(personImage, getImageFormat(personImage), imageX, imageY, imageWidth, imageHeight);

    // Matched Percent - centered under image
    doc.setFontSize(10);
    doc.setFont("Sarabun", "normal");
    const text = `${t('text.percentage-match')} : ${item.percentConfidence} %`;

    // Calculate center X of image box
    const percentTextX = 5 + imageBoxWidth / 2; 
    const percentTextY = imageY + imageHeight + 4;

    doc.text(text, percentTextX, percentTextY, { align: "center" });

    // Box outline rectangle
    doc.setFillColor("#C5C8CB");
    doc.rect(40, y - 5, 165, 12, "F");

    // Box outline
    doc.setDrawColor("#777777");
    doc.rect(40, y - 5, 165, 12);

    // Status
    doc.setFontSize(12);
    doc.setFont("Sarabun", "bold");

    const { backgroundColor } = getPersonTypeColor(item.person_class_id);

    // Rectangle properties
    const rectX = 44;
    const rectY = y - 3.5;
    const rectWidth = 28;
    const rectHeight = 8;

    doc.setFillColor(backgroundColor);
    doc.setTextColor("#000000");

    // Draw filled rectangle
    doc.roundedRect(rectX, rectY, rectWidth, rectHeight, 1, 1, "F");

    // value of the text
    const label = item.person_class
      ? reformatString(item.person_class)
      : t('text.normal');

    // measure text width
    const textWidth = doc.getTextWidth(label);

    const textX = rectX + (rectWidth - textWidth) / 2;
    const textY = rectY + (rectHeight / 2) + 1.5;

    // draw centered text
    doc.text(label, textX, textY);

    doc.setTextColor("#4A4A4A");
    doc.setFont("Sarabun", "normal");
    doc.text(dayjs(item.dateTime).format("DD/MM/YYYY HH:mm"), 90, y + 2);
    doc.text(`${t('text.checkpoint')} : ${item.checkpoints.length > 0 ? item.checkpoints[0].checkpointName : "-"}`, pageWidth - 70, y + 2);

    // Suspect Person info
    doc.setFont("Sarabun", "bold");
    doc.text(`${item.prefix}${item.name}`, (pageWidth / 2) - 62, y + 16);
    // Owner info
    doc.setFont("Sarabun", "normal");
    doc.text(`${t('text.owner-name-2')} : ${item.ownerName} ${item.ownerPhone}`, (pageWidth / 2) - 5, y + 16);
    // Behavior
    remarkList.forEach((line: string, idx: number) => {
      const prefix = idx === 0 ? `${t("text.behavior")} : ` : "";
      doc.text(prefix + line, idx === 0 ? (pageWidth / 2) - 62 : i18n.language === "th" ? (pageWidth / 2) - 40 : (pageWidth / 2) - 42, y + 24 + idx * 6);
    });
    
    y += (plusY * 6) + 42;

    // Page break
    if (y > 270 && index < data.length - 1) {
      doc.addPage();
      currentPage++;
      y = 40;
      addHeader(currentPage, totalPages);
    }
  });

  return doc.output("blob");
};

export const downloadSearchResultPdf = async (
  data: SuspectPersonSearch[],
  fileName: string,
  t: (key: string) => string,
  i18n: any,
) => {
  const blob = await generateSearchResultPdfBlob(data, t, i18n);
  saveAs(blob, fileName);
};